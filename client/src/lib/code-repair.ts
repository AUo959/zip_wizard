/**
 * Code Repair Utilities
 * 
 * Best-effort recovery and repair for corrupted code files.
 * Includes bracket balancing, tag completion, and line-by-line recovery.
 */

import type { CodeRepairStrategy, CodeRepairResult } from '@shared/archive-types';

/**
 * Bracket/parenthesis balancing strategy
 */
export const bracketBalancingStrategy: CodeRepairStrategy = {
  id: 'bracket-balancing',
  name: 'Bracket Balancing',
  description: 'Balances brackets, parentheses, and braces in code',

  async repair(content: string, language?: string): Promise<CodeRepairResult> {
    const lines = content.split('\n');
    const repairedSections: CodeRepairResult['repairedSections'] = [];
    let repairedContent = content;
    let confidence = 1.0;

    const brackets = {
      '(': ')',
      '[': ']',
      '{': '}',
      '<': '>',
    };

    const stack: Array<{ char: string; line: number; col: number }> = [];
    const missingClosers: Array<{ char: string; line: number; col: number }> = [];

    // Analyze bracket structure
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        
        if (char in brackets) {
          stack.push({ char, line: lineNum, col });
        } else if (Object.values(brackets).includes(char)) {
          const last = stack.pop();
          if (!last || brackets[last.char as keyof typeof brackets] !== char) {
            // Mismatched bracket
            confidence *= 0.9;
          }
        }
      }
    }

    // Add missing closing brackets
    if (stack.length > 0) {
      const closers = stack.reverse().map(item => brackets[item.char as keyof typeof brackets]);
      repairedContent += '\n' + closers.join('');
      
      repairedSections.push({
        line: lines.length,
        original: content,
        repaired: repairedContent,
        reason: `Added ${stack.length} missing closing bracket(s): ${closers.join(', ')}`,
      });

      confidence *= 0.8;
    }

    return {
      repairedContent,
      repairedSections,
      confidence,
      complete: stack.length === 0,
    };
  },
};

/**
 * HTML/XML tag completion strategy
 * 
 * Note: This uses a simple regex-based approach for basic tag matching.
 * Limitations:
 * - Does not handle nested tags with the same name correctly
 * - May produce false positives with complex HTML structures
 * - Does not understand context (e.g., tags in strings or comments)
 * 
 * For production use with complex HTML, consider integrating a proper HTML parser
 * like parse5 or htmlparser2.
 */
export const tagCompletionStrategy: CodeRepairStrategy = {
  id: 'tag-completion',
  name: 'Tag Completion',
  description: 'Completes missing HTML/XML closing tags (basic heuristic)',

  async repair(content: string, language?: string): Promise<CodeRepairResult> {
    if (language && !['html', 'xml', 'jsx', 'tsx', 'vue', 'svelte'].includes(language)) {
      return {
        repairedContent: content,
        repairedSections: [],
        confidence: 1.0,
        complete: true,
      };
    }

    const repairedSections: CodeRepairResult['repairedSections'] = [];
    let repairedContent = content;
    let confidence = 1.0;

    // Note: This is a simplified heuristic approach for basic tag completion
    // It will not work correctly with:
    // - Nested tags with the same name (e.g., <div><div></div></div>)
    // - Tags split across multiple lines
    // - Tags in strings or comments
    // For robust HTML parsing, integrate a proper HTML parser library
    // Pattern uses bounded lookahead to prevent catastrophic backtracking
    const openTagRegex = /<(\w+)(?:\s[^>]*)?>(?![\s\S]{0,1000}<\/\1>)/g;
    const selfClosingTags = new Set(['br', 'hr', 'img', 'input', 'link', 'meta', 'area', 'base', 'col', 'command', 'embed', 'keygen', 'param', 'source', 'track', 'wbr']);

    const lines = content.split('\n');
    const unclosedTags: string[] = [];

    // Find unclosed tags (very simplified)
    const matches = Array.from(content.matchAll(openTagRegex));
    for (const match of matches) {
      const tagName = match[1].toLowerCase();
      if (!selfClosingTags.has(tagName)) {
        unclosedTags.push(tagName);
      }
    }

    if (unclosedTags.length > 0) {
      const closingTags = unclosedTags.reverse().map(tag => `</${tag}>`).join('\n');
      repairedContent += '\n' + closingTags;

      repairedSections.push({
        line: lines.length,
        original: content,
        repaired: repairedContent,
        reason: `Added ${unclosedTags.length} missing closing tag(s): ${unclosedTags.join(', ')}`,
      });

      confidence *= 0.7;
    }

    return {
      repairedContent,
      repairedSections,
      confidence,
      complete: unclosedTags.length === 0,
    };
  },
};

/**
 * Line-by-line recovery strategy
 */
export const lineByLineRecoveryStrategy: CodeRepairStrategy = {
  id: 'line-recovery',
  name: 'Line-by-Line Recovery',
  description: 'Recovers individual valid lines from corrupted files',

  async repair(content: string, language?: string): Promise<CodeRepairResult> {
    const lines = content.split('\n');
    const repairedSections: CodeRepairResult['repairedSections'] = [];
    const recoveredLines: string[] = [];
    let validLineCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line contains obvious corruption markers
      const hasNullBytes = line.includes('\0');
      const hasInvalidUtf8 = /[\uFFFD]/.test(line);
      const hasExcessiveSpecialChars = (line.match(/[^\x20-\x7E\s]/g) || []).length > line.length * 0.3;

      if (hasNullBytes || hasInvalidUtf8 || hasExcessiveSpecialChars) {
        // Try to clean the line
        const cleaned = line
          .replace(/\0/g, '')
          .replace(/[\uFFFD]/g, '')
          .replace(/[^\x20-\x7E\s]/g, '');

        if (cleaned.trim().length > 0) {
          recoveredLines.push(cleaned);
          repairedSections.push({
            line: i + 1,
            original: line,
            repaired: cleaned,
            reason: 'Removed invalid characters',
          });
        } else {
          recoveredLines.push('// [Corrupted line removed]');
          repairedSections.push({
            line: i + 1,
            original: line,
            repaired: '// [Corrupted line removed]',
            reason: 'Line too corrupted to recover',
          });
        }
      } else {
        recoveredLines.push(line);
        validLineCount++;
      }
    }

    const confidence = lines.length > 0 ? validLineCount / lines.length : 0;

    return {
      repairedContent: recoveredLines.join('\n'),
      repairedSections,
      confidence,
      complete: repairedSections.length === 0,
    };
  },
};

/**
 * Combined repair strategy that applies multiple strategies
 */
export const combinedRepairStrategy: CodeRepairStrategy = {
  id: 'combined-repair',
  name: 'Combined Repair',
  description: 'Applies multiple repair strategies in sequence',

  async repair(content: string, language?: string): Promise<CodeRepairResult> {
    const strategies = [
      lineByLineRecoveryStrategy,
      bracketBalancingStrategy,
      tagCompletionStrategy,
    ];

    let currentContent = content;
    let allRepairedSections: CodeRepairResult['repairedSections'] = [];
    let minConfidence = 1.0;
    let allComplete = true;

    for (const strategy of strategies) {
      const result = await strategy.repair(currentContent, language);
      currentContent = result.repairedContent;
      allRepairedSections = [...allRepairedSections, ...result.repairedSections];
      minConfidence = Math.min(minConfidence, result.confidence);
      allComplete = allComplete && result.complete;
    }

    return {
      repairedContent: currentContent,
      repairedSections: allRepairedSections,
      confidence: minConfidence,
      complete: allComplete,
    };
  },
};

/**
 * Repair code using specified strategy
 */
export const repairCode = async (
  content: string,
  language?: string,
  strategyId?: string
): Promise<CodeRepairResult> => {
  const strategies: Record<string, CodeRepairStrategy> = {
    'bracket-balancing': bracketBalancingStrategy,
    'tag-completion': tagCompletionStrategy,
    'line-recovery': lineByLineRecoveryStrategy,
    'combined-repair': combinedRepairStrategy,
  };

  const strategy = strategies[strategyId || 'combined-repair'] || combinedRepairStrategy;
  return strategy.repair(content, language);
};

/**
 * Detect language from file extension
 */
export const detectLanguage = (filename: string): string | undefined => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'jsx',
    'ts': 'typescript',
    'tsx': 'tsx',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'html': 'html',
    'xml': 'xml',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'vue': 'vue',
    'svelte': 'svelte',
  };

  return ext ? languageMap[ext] : undefined;
};
