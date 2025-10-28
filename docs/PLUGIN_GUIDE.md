# Plugin Development Guide

This guide explains how to extend ZIP Wizard with custom functionality through plugins and extensions.

## Table of Contents

- [Overview](#overview)
- [Plugin Types](#plugin-types)
- [Format Handlers](#format-handlers)
- [Vulnerability Scanners](#vulnerability-scanners)
- [AI Analyzers](#ai-analyzers)
- [UI Extensions](#ui-extensions)
- [Best Practices](#best-practices)

## Overview

ZIP Wizard's plugin system allows you to:

- Add support for new archive formats
- Implement custom vulnerability detection
- Create specialized AI analysis tools
- Extend the UI with custom views
- Add export formats and integrations

## Plugin Types

### 1. Format Handlers

Add support for custom archive formats.

**Interface:**
```typescript
interface FormatHandler {
  name: string;
  extensions: string[];
  mimeTypes: string[];
  canHandle(buffer: Buffer): boolean;
  parse(buffer: Buffer): Promise<ArchiveMetadata>;
  extract(buffer: Buffer, path: string): Promise<FileEntry[]>;
}
```

**Example:**
```typescript
// server/formats/rar-handler.ts
import { FormatHandler } from '../lib/format-handler';

export class RarFormatHandler implements FormatHandler {
  name = 'RAR Archive';
  extensions = ['.rar', '.r00', '.r01'];
  mimeTypes = ['application/x-rar-compressed'];

  canHandle(buffer: Buffer): boolean {
    // RAR signature: 52 61 72 21 1A 07
    return buffer.toString('hex', 0, 6) === '526172211a07';
  }

  async parse(buffer: Buffer): Promise<ArchiveMetadata> {
    // Your RAR parsing logic
    return {
      format: 'rar',
      version: '5.0',
      compression: 'normal',
      fileCount: 0,
      totalSize: buffer.length,
      files: []
    };
  }

  async extract(buffer: Buffer, path: string): Promise<FileEntry[]> {
    // Extraction logic
    return [];
  }
}
```

**Registration:**
```typescript
// server/index.ts
import { RarFormatHandler } from './formats/rar-handler';

app.use('/api', (req, res, next) => {
  registerFormatHandler(new RarFormatHandler());
  next();
});
```

### 2. Vulnerability Scanners

Implement custom security scanning logic.

**Interface:**
```typescript
interface VulnerabilityScanner {
  name: string;
  priority: number;
  scan(file: FileEntry): Promise<ScanResult>;
}

interface ScanResult {
  threats: Threat[];
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}
```

**Example:**
```typescript
// server/scanners/malware-scanner.ts
export class MalwareScanner implements VulnerabilityScanner {
  name = 'Malware Scanner';
  priority = 100;

  private signatures: Map<string, string> = new Map([
    ['deadbeef', 'Known malware signature'],
    ['cafebabe', 'Suspicious executable pattern']
  ]);

  async scan(file: FileEntry): Promise<ScanResult> {
    const threats: Threat[] = [];
    const buffer = await file.readContent();
    const hex = buffer.toString('hex');

    for (const [signature, description] of this.signatures) {
      if (hex.includes(signature)) {
        threats.push({
          type: 'malware',
          severity: 'critical',
          description,
          location: file.path,
          cve: null
        });
      }
    }

    return {
      threats,
      severity: threats.length > 0 ? 'critical' : 'none',
      recommendations: threats.length > 0 
        ? ['Quarantine this file immediately', 'Run full system scan']
        : []
    };
  }
}
```

### 3. AI Analyzers

Create specialized AI-powered analysis tools.

**Interface:**
```typescript
interface AIAnalyzer {
  name: string;
  supportedFileTypes: string[];
  analyze(files: FileEntry[]): Promise<Insights>;
}

interface Insights {
  summary: string;
  patterns: Pattern[];
  recommendations: string[];
  confidence: number;
}
```

**Example:**
```typescript
// server/ai/code-quality-analyzer.ts
export class CodeQualityAnalyzer implements AIAnalyzer {
  name = 'Code Quality Analyzer';
  supportedFileTypes = ['.js', '.ts', '.py', '.java'];

  async analyze(files: FileEntry[]): Promise<Insights> {
    const codeFiles = files.filter(f => 
      this.supportedFileTypes.some(ext => f.name.endsWith(ext))
    );

    const patterns: Pattern[] = [];
    let totalComplexity = 0;

    for (const file of codeFiles) {
      const content = await file.readContent();
      const complexity = this.calculateComplexity(content);
      totalComplexity += complexity;

      if (complexity > 15) {
        patterns.push({
          type: 'high-complexity',
          file: file.path,
          severity: 'warning',
          description: `High cyclomatic complexity: ${complexity}`
        });
      }
    }

    const avgComplexity = totalComplexity / codeFiles.length;

    return {
      summary: `Analyzed ${codeFiles.length} code files. Average complexity: ${avgComplexity.toFixed(2)}`,
      patterns,
      recommendations: avgComplexity > 10 
        ? ['Consider refactoring complex functions', 'Add unit tests for high-complexity code']
        : ['Code quality is good'],
      confidence: 0.85
    };
  }

  private calculateComplexity(content: Buffer): number {
    // Simplified cyclomatic complexity calculation
    const code = content.toString();
    const conditionals = (code.match(/if|for|while|case|catch/g) || []).length;
    return conditionals + 1;
  }
}
```

### 4. UI Extensions

Add custom views and components to the UI.

**Example:**
```typescript
// client/src/plugins/custom-view.tsx
import { ViewDefinition } from '@/types';

export const customView: ViewDefinition = {
  id: 'custom-analytics',
  label: 'Custom Analytics',
  icon: '📊',
  category: 'analysis',
  component: CustomAnalyticsView
};

function CustomAnalyticsView() {
  return (
    <div className="p-4">
      <h2>Custom Analytics</h2>
      {/* Your custom UI */}
    </div>
  );
}
```

**Registration:**
```typescript
// client/src/main.tsx
import { registerView } from './lib/view-registry';
import { customView } from './plugins/custom-view';

registerView(customView);
```

## Best Practices

### Performance

1. **Use streaming for large files**
   ```typescript
   async parse(stream: ReadableStream): Promise<Metadata> {
     // Process in chunks
   }
   ```

2. **Implement cancellation**
   ```typescript
   async scan(file: FileEntry, signal: AbortSignal): Promise<ScanResult> {
     if (signal.aborted) throw new Error('Cancelled');
     // ...
   }
   ```

3. **Cache expensive operations**
   ```typescript
   private cache = new Map<string, ScanResult>();
   
   async scan(file: FileEntry): Promise<ScanResult> {
     const cacheKey = file.hash;
     if (this.cache.has(cacheKey)) {
       return this.cache.get(cacheKey)!;
     }
     // ...
   }
   ```

### Security

1. **Validate all inputs**
   ```typescript
   canHandle(buffer: Buffer): boolean {
     if (buffer.length < 4) return false;
     // Validate signature
   }
   ```

2. **Handle errors gracefully**
   ```typescript
   async parse(buffer: Buffer): Promise<ArchiveMetadata> {
     try {
       // Parsing logic
     } catch (error) {
       return {
         format: 'unknown',
         error: error.message
       };
     }
   }
   ```

3. **Set timeouts**
   ```typescript
   async scan(file: FileEntry): Promise<ScanResult> {
     return Promise.race([
       this.doScan(file),
       this.timeout(30000)
     ]);
   }
   ```

### Testing

Always include tests for your plugins:

```typescript
// __tests__/rar-handler.test.ts
import { RarFormatHandler } from '../server/formats/rar-handler';

describe('RarFormatHandler', () => {
  const handler = new RarFormatHandler();

  it('should detect RAR archives', () => {
    const rarBuffer = Buffer.from('526172211a07', 'hex');
    expect(handler.canHandle(rarBuffer)).toBe(true);
  });

  it('should reject non-RAR files', () => {
    const zipBuffer = Buffer.from('504b0304', 'hex');
    expect(handler.canHandle(zipBuffer)).toBe(false);
  });

  it('should parse RAR metadata', async () => {
    const metadata = await handler.parse(rarBuffer);
    expect(metadata.format).toBe('rar');
  });
});
```

## Plugin API Reference

### Core Interfaces

```typescript
// Format Handler
interface FormatHandler {
  name: string;
  extensions: string[];
  mimeTypes: string[];
  canHandle(buffer: Buffer): boolean;
  parse(buffer: Buffer): Promise<ArchiveMetadata>;
  extract(buffer: Buffer, path: string): Promise<FileEntry[]>;
}

// Vulnerability Scanner
interface VulnerabilityScanner {
  name: string;
  priority: number;
  scan(file: FileEntry): Promise<ScanResult>;
}

// AI Analyzer
interface AIAnalyzer {
  name: string;
  supportedFileTypes: string[];
  analyze(files: FileEntry[]): Promise<Insights>;
}

// View Definition
interface ViewDefinition {
  id: string;
  label: string;
  icon: string;
  category: string;
  component: React.ComponentType;
}
```

## Publishing Your Plugin

1. Create a package:
   ```bash
   npm init @zipwizard/plugin-<name>
   ```

2. Add plugin metadata:
   ```json
   {
     "name": "@zipwizard/plugin-rar",
     "version": "1.0.0",
     "zipwizard": {
       "type": "format-handler",
       "compatibility": ">=1.0.0"
     }
   }
   ```

3. Publish:
   ```bash
   npm publish
   ```

4. Users install:
   ```bash
   npm install @zipwizard/plugin-rar
   ```

## Examples

See the [examples/plugins](../examples/plugins) directory for complete working examples:

- `rar-handler/` - RAR format support
- `virus-total/` - VirusTotal API integration
- `ai-summarizer/` - AI-powered file summarization
- `custom-export/` - Custom export format

## Support

- Questions: [GitHub Discussions](https://github.com/AUo959/zip_wizard/discussions)
- Bug reports: [GitHub Issues](https://github.com/AUo959/zip_wizard/issues)
- Security: security@zipwizard.example
