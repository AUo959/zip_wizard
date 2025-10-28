/**
 * Attempt clever recovery of broken code/files.
 * Use AI model or heuristics to fill in gaps, close blocks, annotate repairs.
 */

export interface RepairResult {
  reconstructed: string;
  notes: string[];
  confidence: number; // 0-1
  changes: RepairChange[];
}

export interface RepairChange {
  line: number;
  type: 'added' | 'modified' | 'removed';
  before?: string;
  after?: string;
  reason: string;
}

/**
 * Attempt to repair broken or incomplete code.
 * Uses heuristics and pattern matching to reconstruct missing parts.
 * 
 * @param code - The potentially broken code
 * @param language - Optional language hint for better repair
 * @returns Repair result with reconstructed code and notes
 */
export async function magicRepairCode(
  code: string,
  language?: string
): Promise<RepairResult> {
  const notes: string[] = [];
  const changes: RepairChange[] = [];
  let reconstructed = code;
  let confidence = 1.0;

  // 1. Fix missing braces
  const braceResult = fixMissingBraces(reconstructed);
  if (braceResult.fixed) {
    reconstructed = braceResult.code;
    notes.push(...braceResult.notes);
    changes.push(...braceResult.changes);
    confidence *= 0.9;
  }

  // 2. Fix missing parentheses
  const parenResult = fixMissingParentheses(reconstructed);
  if (parenResult.fixed) {
    reconstructed = parenResult.code;
    notes.push(...parenResult.notes);
    changes.push(...parenResult.changes);
    confidence *= 0.9;
  }

  // 3. Fix missing quotes
  const quoteResult = fixMissingQuotes(reconstructed);
  if (quoteResult.fixed) {
    reconstructed = quoteResult.code;
    notes.push(...quoteResult.notes);
    changes.push(...quoteResult.changes);
    confidence *= 0.85;
  }

  // 4. Fix truncated lines
  const truncResult = fixTruncatedLines(reconstructed);
  if (truncResult.fixed) {
    reconstructed = truncResult.code;
    notes.push(...truncResult.notes);
    changes.push(...truncResult.changes);
    confidence *= 0.8;
  }

  // 5. Add language-specific fixes
  if (language) {
    const langResult = applyLanguageSpecificFixes(reconstructed, language);
    if (langResult.fixed) {
      reconstructed = langResult.code;
      notes.push(...langResult.notes);
      changes.push(...langResult.changes);
      confidence *= 0.9;
    }
  }

  // If no changes were made
  if (changes.length === 0) {
    notes.push('No repairs needed - code appears complete');
  }

  return {
    reconstructed,
    notes,
    confidence,
    changes
  };
}

/**
 * Fix missing closing braces.
 */
function fixMissingBraces(code: string): {
  code: string;
  fixed: boolean;
  notes: string[];
  changes: RepairChange[];
} {
  const notes: string[] = [];
  const changes: RepairChange[] = [];
  
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  const missing = openBraces - closeBraces;

  if (missing > 0) {
    const lines = code.split('\n');
    const lastLine = lines.length;
    
    code += '\n' + '}'.repeat(missing);
    notes.push(`Added ${missing} missing closing brace(s)`);
    
    for (let i = 0; i < missing; i++) {
      changes.push({
        line: lastLine + i,
        type: 'added',
        after: '}',
        reason: 'Missing closing brace'
      });
    }
    
    return { code, fixed: true, notes, changes };
  }

  return { code, fixed: false, notes, changes };
}

/**
 * Fix missing closing parentheses.
 */
function fixMissingParentheses(code: string): {
  code: string;
  fixed: boolean;
  notes: string[];
  changes: RepairChange[];
} {
  const notes: string[] = [];
  const changes: RepairChange[] = [];
  
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;
  const missing = openParens - closeParens;

  if (missing > 0) {
    const lines = code.split('\n');
    const lastLine = lines.length;
    
    code += ')'.repeat(missing);
    notes.push(`Added ${missing} missing closing parenthesis/parentheses`);
    
    for (let i = 0; i < missing; i++) {
      changes.push({
        line: lastLine + i,
        type: 'added',
        after: ')',
        reason: 'Missing closing parenthesis'
      });
    }
    
    return { code, fixed: true, notes, changes };
  }

  return { code, fixed: false, notes, changes };
}

/**
 * Fix missing quotes (basic heuristic).
 */
function fixMissingQuotes(code: string): {
  code: string;
  fixed: boolean;
  notes: string[];
  changes: RepairChange[];
} {
  const notes: string[] = [];
  const changes: RepairChange[] = [];
  
  // Count unmatched quotes by line
  const lines = code.split('\n');
  let fixed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Simple check for unclosed string literals
    const singleQuotes = (line.match(/'/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    const backticks = (line.match(/`/g) || []).length;

    // If odd number of quotes, likely unclosed
    if (singleQuotes % 2 !== 0 && !line.includes('//') && !line.includes('/*')) {
      lines[i] += "'";
      notes.push(`Added missing closing quote on line ${i + 1}`);
      changes.push({
        line: i + 1,
        type: 'modified',
        before: line,
        after: lines[i],
        reason: 'Unclosed string literal'
      });
      fixed = true;
    }
  }

  if (fixed) {
    return { code: lines.join('\n'), fixed: true, notes, changes };
  }

  return { code, fixed: false, notes, changes };
}

/**
 * Fix truncated lines (lines that end mid-statement).
 */
function fixTruncatedLines(code: string): {
  code: string;
  fixed: boolean;
  notes: string[];
  changes: RepairChange[];
} {
  const notes: string[] = [];
  const changes: RepairChange[] = [];
  const lines = code.split('\n');
  let fixed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for lines ending with operators or incomplete statements
    if (line.endsWith(',') || line.endsWith('+') || line.endsWith('=') || 
        line.endsWith('&&') || line.endsWith('||')) {
      // Add semicolon comment to indicate truncation
      lines[i] += ' /* [TRUNCATED] */';
      notes.push(`Marked truncated statement on line ${i + 1}`);
      changes.push({
        line: i + 1,
        type: 'modified',
        before: line,
        after: lines[i],
        reason: 'Incomplete statement detected'
      });
      fixed = true;
    }
  }

  if (fixed) {
    return { code: lines.join('\n'), fixed: true, notes, changes };
  }

  return { code, fixed: false, notes, changes };
}

/**
 * Apply language-specific repair heuristics.
 */
function applyLanguageSpecificFixes(code: string, language: string): {
  code: string;
  fixed: boolean;
  notes: string[];
  changes: RepairChange[];
} {
  const notes: string[] = [];
  const changes: RepairChange[] = [];
  let fixed = false;

  // Python-specific fixes
  if (language === 'python') {
    // Check for missing colons
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if ((line.startsWith('if ') || line.startsWith('def ') || 
           line.startsWith('class ') || line.startsWith('for ') || 
           line.startsWith('while ')) && !line.endsWith(':')) {
        lines[i] += ':';
        notes.push(`Added missing colon on line ${i + 1}`);
        changes.push({
          line: i + 1,
          type: 'modified',
          before: line,
          after: lines[i],
          reason: 'Missing colon in Python statement'
        });
        fixed = true;
      }
    }
    
    if (fixed) {
      return { code: lines.join('\n'), fixed: true, notes, changes };
    }
  }

  // JavaScript/TypeScript specific fixes
  if (language === 'javascript' || language === 'typescript') {
    // Add missing semicolons at end of statements
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.endsWith(';') && !line.endsWith('{') && 
          !line.endsWith('}') && !line.startsWith('//') && 
          !line.startsWith('/*') && !line.startsWith('*')) {
        // Check if it looks like a statement
        if (line.includes('=') || line.includes('return') || 
            line.includes('const ') || line.includes('let ') || 
            line.includes('var ')) {
          lines[i] += ';';
          notes.push(`Added missing semicolon on line ${i + 1}`);
          changes.push({
            line: i + 1,
            type: 'modified',
            before: line,
            after: lines[i],
            reason: 'Missing semicolon'
          });
          fixed = true;
        }
      }
    }
    
    if (fixed) {
      return { code: lines.join('\n'), fixed: true, notes, changes };
    }
  }

  return { code, fixed: false, notes, changes };
}

/**
 * Repair binary file (attempt to recover corrupted data).
 */
export async function repairBinaryFile(
  data: ArrayBuffer,
  fileType?: string
): Promise<{
  repaired: ArrayBuffer;
  notes: string[];
  recoveredBytes: number;
}> {
  const notes: string[] = [];
  let recoveredBytes = 0;

  // For now, just return original data
  // In a real implementation, this would attempt to:
  // - Fix corrupted headers
  // - Recover partial data
  // - Reconstruct file structure
  
  notes.push('Binary repair not yet implemented - returning original data');
  
  return {
    repaired: data,
    notes,
    recoveredBytes
  };
}
