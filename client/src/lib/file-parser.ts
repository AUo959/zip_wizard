/**
 * Universal File Parser System
 * Handles all file types with intelligent detection and parsing
 */

import JSZip from 'jszip';

export interface FileMetadata {
  type: string;
  mimeType: string;
  encoding?: string;
  size: number;
  created?: Date;
  modified?: Date;
  author?: string;
  title?: string;
  description?: string;
  tags?: string[];
  dimensions?: { width: number; height: number };
  duration?: number;
  bitrate?: number;
  format?: string;
  compression?: string;
  compressed?: boolean;
  encrypted?: boolean;
  pages?: number;
  words?: number;
  language?: string;
  checksum?: string;
  exif?: Record<string, unknown>;
  customMetadata?: Record<string, unknown>;
}

export interface ParsedFile {
  name: string;
  path: string;
  content?: string | ArrayBuffer;
  metadata: FileMetadata;
  children?: ParsedFile[];
  preview?: string;
  extractedText?: string;
  structure?: Record<string, unknown>;
  warnings?: string[];
  errors?: string[];
}

export interface ParserCapabilities {
  canParse: (file: File | Blob) => boolean;
  parse: (file: File | Blob, options?: Record<string, unknown>) => Promise<ParsedFile>;
  priority: number;
}

interface PdfMetadata {
  pages: number;
  encrypted: boolean;
  text: string;
  preview: string;
  title?: string;
  author?: string;
}

export class UniversalFileParser {
  private parsers: Map<string, ParserCapabilities> = new Map();

  constructor() {
    this.registerDefaultParsers();
  }

  /**
   * Register default parsers for common file types
   */
  private registerDefaultParsers() {
    // Archive parsers
    this.registerParser('zip', new ZipArchiveParser());
    this.registerParser('tar', new TarArchiveParser());
    this.registerParser('rar', new RarArchiveParser());
    this.registerParser('7z', new SevenZipParser());
    this.registerParser('gz', new GzipParser());

    // Document parsers
    this.registerParser('pdf', new PdfParser());
    this.registerParser('docx', new DocxParser());
    this.registerParser('xlsx', new ExcelParser());
    this.registerParser('pptx', new PowerPointParser());
    this.registerParser('odt', new OpenDocumentParser());

    // Code parsers
    this.registerParser('code', new CodeFileParser());
    this.registerParser('json', new JsonParser());
    this.registerParser('xml', new XmlParser());
    this.registerParser('yaml', new YamlParser());

    // Image parsers
    this.registerParser('image', new ImageParser());
    this.registerParser('svg', new SvgParser());
    this.registerParser('psd', new PhotoshopParser());

    // Media parsers
    this.registerParser('video', new VideoParser());
    this.registerParser('audio', new AudioParser());

    // Database parsers
    this.registerParser('sqlite', new SqliteParser());
    this.registerParser('csv', new CsvParser());

    // Binary parsers
    this.registerParser('exe', new ExecutableParser());
    this.registerParser('dll', new DllParser());
    this.registerParser('wasm', new WasmParser());

    // Fallback parser
    this.registerParser('fallback', new FallbackParser());
  }

  /**
   * Register a custom parser
   */
  registerParser(name: string, parser: ParserCapabilities) {
    this.parsers.set(name, parser);
  }

  /**
   * Parse any file type
   */
  async parseFile(file: File | Blob): Promise<ParsedFile> {
    // Try to find a suitable parser
    const sortedParsers = Array.from(this.parsers.values()).sort((a, b) => b.priority - a.priority);

    for (const parser of sortedParsers) {
      if (parser.canParse(file)) {
        try {
          return await parser.parse(file);
        } catch (error) {
          console.warn(`Parser failed:`, error);
          // Continue to next parser
        }
      }
    }

    // Use fallback parser if no specific parser worked
    const fallback = this.parsers.get('fallback')!;
    return fallback.parse(file);
  }

  /**
   * Detect file type from various sources
   */
  detectFileType(file: File | Blob): string {
    // Check MIME type
    if (file.type) {
      return file.type;
    }

    // Check file extension if available
    if ('name' in file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext) {
        return this.getTypeFromExtension(ext);
      }
    }

    // Default to binary
    return 'application/octet-stream';
  }

  /**
   * Get MIME type from extension
   */
  private getTypeFromExtension(ext: string): string {
    const mimeTypes: Record<string, string> = {
      // Archives
      zip: 'application/zip',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      rar: 'application/x-rar',
      '7z': 'application/x-7z-compressed',

      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

      // Code
      js: 'text/javascript',
      ts: 'text/typescript',
      py: 'text/x-python',
      java: 'text/x-java',
      c: 'text/x-c',
      cpp: 'text/x-c++',
      cs: 'text/x-csharp',
      go: 'text/x-go',
      rs: 'text/x-rust',
      php: 'text/x-php',
      rb: 'text/x-ruby',

      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      bmp: 'image/bmp',
      ico: 'image/x-icon',

      // Audio/Video
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',

      // Data
      json: 'application/json',
      xml: 'application/xml',
      yaml: 'application/x-yaml',
      yml: 'application/x-yaml',
      csv: 'text/csv',
      sql: 'application/sql',

      // Other
      txt: 'text/plain',
      md: 'text/markdown',
      html: 'text/html',
      css: 'text/css',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}

/**
 * ZIP Archive Parser
 */
class ZipArchiveParser implements ParserCapabilities {
  priority = 100;

  canParse(file: File | Blob): boolean {
    return file.type === 'application/zip' || ('name' in file && file.name.endsWith('.zip'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);
    const children: ParsedFile[] = [];

    for (const [path, zipEntry] of Object.entries(content.files)) {
      if (!zipEntry.dir) {
        const data = await zipEntry.async('string');
        children.push({
          name: path.split('/').pop() || path,
          path,
          content: data,
          metadata: {
            type: 'file',
            mimeType: 'text/plain',
            size: data.length,
            compressed: true,
            compression: 'deflate',
          },
        });
      }
    }

    return {
      name: 'name' in file ? file.name : 'archive.zip',
      path: '',
      metadata: {
        type: 'archive',
        mimeType: 'application/zip',
        size: file.size,
        format: 'ZIP',
        encrypted: false,
      },
      children,
    };
  }
}

/**
 * TAR Archive Parser
 */
class TarArchiveParser implements ParserCapabilities {
  priority = 90;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/x-tar' ||
      ('name' in file && (file.name.endsWith('.tar') || file.name.includes('.tar.')))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer();
    const children = this.parseTar(buffer);

    return {
      name: 'name' in file ? file.name : 'archive.tar',
      path: '',
      metadata: {
        type: 'archive',
        mimeType: 'application/x-tar',
        size: file.size,
        format: 'TAR',
      },
      children,
    };
  }

  private parseTar(buffer: ArrayBuffer): ParsedFile[] {
    const files: ParsedFile[] = [];
    const view = new DataView(buffer);
    let offset = 0;

    while (offset < buffer.byteLength - 512) {
      // TAR header is 512 bytes
      const header = new Uint8Array(buffer, offset, 512);

      // Check if this is the end of archive (all zeros)
      if (header.every(b => b === 0)) break;

      // Extract filename (first 100 bytes)
      const nameBytes = header.slice(0, 100);
      const name = new TextDecoder().decode(nameBytes).replace(/\0/g, '');

      if (name) {
        // Extract file size (bytes 124-135, octal)
        const sizeStr = new TextDecoder().decode(header.slice(124, 135)).replace(/\0/g, '');
        const size = parseInt(sizeStr, 8) || 0;

        // Extract file content
        const contentStart = offset + 512;
        const content = new Uint8Array(buffer, contentStart, size);

        files.push({
          name,
          path: name,
          content: new TextDecoder().decode(content),
          metadata: {
            type: 'file',
            mimeType: 'application/octet-stream',
            size,
          },
        });

        // Move to next file (align to 512 byte boundary)
        offset = contentStart + Math.ceil(size / 512) * 512;
      } else {
        offset += 512;
      }
    }

    return files;
  }
}

/**
 * RAR Archive Parser (stub - would need external library)
 */
class RarArchiveParser implements ParserCapabilities {
  priority = 80;

  canParse(file: File | Blob): boolean {
    return file.type === 'application/x-rar' || ('name' in file && file.name.endsWith('.rar'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    return {
      name: 'name' in file ? file.name : 'archive.rar',
      path: '',
      metadata: {
        type: 'archive',
        mimeType: 'application/x-rar',
        size: file.size,
        format: 'RAR',
      },
      warnings: [
        'RAR format detected but full parsing not implemented. Consider converting to ZIP format.',
      ],
    };
  }
}

/**
 * 7-Zip Parser (stub)
 */
class SevenZipParser implements ParserCapabilities {
  priority = 80;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/x-7z-compressed' || ('name' in file && file.name.endsWith('.7z'))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    return {
      name: 'name' in file ? file.name : 'archive.7z',
      path: '',
      metadata: {
        type: 'archive',
        mimeType: 'application/x-7z-compressed',
        size: file.size,
        format: '7Z',
      },
      warnings: [
        '7-Zip format detected but full parsing not implemented. Consider converting to ZIP format.',
      ],
    };
  }
}

/**
 * GZIP Parser
 */
class GzipParser implements ParserCapabilities {
  priority = 85;

  canParse(file: File | Blob): boolean {
    return file.type === 'application/gzip' || ('name' in file && file.name.endsWith('.gz'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer();
    const decompressed = await this.decompress(buffer);

    return {
      name: 'name' in file ? file.name : 'file.gz',
      path: '',
      content: decompressed,
      metadata: {
        type: 'compressed',
        mimeType: 'application/gzip',
        size: file.size,
        compression: 'gzip',
      },
    };
  }

  private async decompress(buffer: ArrayBuffer): Promise<string> {
    // Simple GZIP detection
    const view = new DataView(buffer);
    if (view.getUint16(0) === 0x1f8b) {
      // This is GZIP compressed
      return '[GZIP compressed data - decompression would require pako or similar library]';
    }
    return new TextDecoder().decode(buffer);
  }
}

/**
 * PDF Parser (basic metadata extraction)
 */
class PdfParser implements ParserCapabilities {
  priority = 90;

  canParse(file: File | Blob): boolean {
    return file.type === 'application/pdf' || ('name' in file && file.name.endsWith('.pdf'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer();
    const metadata = this.extractPdfMetadata(buffer);

    return {
      name: 'name' in file ? file.name : 'document.pdf',
      path: '',
      metadata: {
        type: 'document',
        mimeType: 'application/pdf',
        size: file.size,
        format: 'PDF',
        pages: metadata.pages,
        title: metadata.title,
        author: metadata.author,
        encrypted: metadata.encrypted,
      },
      extractedText: metadata.text,
      preview: metadata.preview,
    };
  }

  private extractPdfMetadata(buffer: ArrayBuffer): PdfMetadata {
    const bytes = new Uint8Array(buffer);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    // Check PDF header
    const isPdf = text.startsWith('%PDF');

    // Extract basic metadata
    const metadata: PdfMetadata = {
      pages: 0,
      encrypted: false,
      text: '',
      preview: '',
    };

    if (isPdf) {
      // Count pages (crude method)
      const pageMatches = text.match(/\/Type\s*\/Page(?!s)/g);
      metadata.pages = pageMatches ? pageMatches.length : 0;

      // Check for encryption
      metadata.encrypted = text.includes('/Encrypt');

      // Extract title
      const titleMatch = text.match(/\/Title\s*\((.*?)\)/);
      if (titleMatch) metadata.title = titleMatch[1];

      // Extract author
      const authorMatch = text.match(/\/Author\s*\((.*?)\)/);
      if (authorMatch) metadata.author = authorMatch[1];

      // Extract preview text (first readable content)
      const textMatch = text.match(/\((.*?)\)/g);
      if (textMatch) {
        metadata.preview = textMatch
          .slice(0, 5)
          .map(m => m.slice(1, -1))
          .filter(t => t.length > 10)
          .join(' ')
          .substring(0, 200);
      }
    }

    return metadata;
  }
}

/**
 * DOCX Parser (Word documents)
 */
class DocxParser implements ParserCapabilities {
  priority = 85;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ('name' in file && file.name.endsWith('.docx'))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    // DOCX files are actually ZIP archives
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);

      // Extract text from document.xml
      let extractedText = '';
      const docXml = content.files['word/document.xml'];
      if (docXml) {
        const xmlContent = await docXml.async('string');
        // Extract text from XML (crude method)
        extractedText = xmlContent
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      // Get document properties
      let metadata: any = {};
      const coreXml = content.files['docProps/core.xml'];
      if (coreXml) {
        const propsContent = await coreXml.async('string');
        const titleMatch = propsContent.match(/<dc:title>(.*?)<\/dc:title>/);
        if (titleMatch) metadata.title = titleMatch[1];

        const authorMatch = propsContent.match(/<dc:creator>(.*?)<\/dc:creator>/);
        if (authorMatch) metadata.author = authorMatch[1];
      }

      return {
        name: 'name' in file ? file.name : 'document.docx',
        path: '',
        extractedText: extractedText.substring(0, 5000),
        metadata: {
          type: 'document',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: file.size,
          format: 'DOCX',
          words: extractedText.split(/\s+/).length,
          ...metadata,
        },
      };
    } catch (_error) {
      return {
        name: 'name' in file ? file.name : 'document.docx',
        path: '',
        metadata: {
          type: 'document',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: file.size,
          format: 'DOCX',
        },
        errors: ['Failed to parse DOCX structure'],
      };
    }
  }
}

/**
 * Excel Parser
 */
class ExcelParser implements ParserCapabilities {
  priority = 85;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      ('name' in file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    // XLSX files are ZIP archives
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);

      // Count sheets
      let sheetCount = 0;
      for (const path in content.files) {
        if (path.startsWith('xl/worksheets/sheet')) {
          sheetCount++;
        }
      }

      return {
        name: 'name' in file ? file.name : 'spreadsheet.xlsx',
        path: '',
        metadata: {
          type: 'spreadsheet',
          mimeType:
            file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: file.size,
          format: 'XLSX',
          customMetadata: {
            sheets: sheetCount,
          },
        },
        structure: {
          sheets: sheetCount,
        },
      };
    } catch {
      return {
        name: 'name' in file ? file.name : 'spreadsheet',
        path: '',
        metadata: {
          type: 'spreadsheet',
          mimeType: file.type || 'application/vnd.ms-excel',
          size: file.size,
          format: 'Excel',
        },
      };
    }
  }
}

/**
 * PowerPoint Parser
 */
class PowerPointParser implements ParserCapabilities {
  priority = 85;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      ('name' in file && file.name.endsWith('.pptx'))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);

      // Count slides
      let slideCount = 0;
      for (const path in content.files) {
        if (path.startsWith('ppt/slides/slide')) {
          slideCount++;
        }
      }

      return {
        name: 'name' in file ? file.name : 'presentation.pptx',
        path: '',
        metadata: {
          type: 'presentation',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: file.size,
          format: 'PPTX',
          customMetadata: {
            slides: slideCount,
          },
        },
      };
    } catch {
      return {
        name: 'name' in file ? file.name : 'presentation.pptx',
        path: '',
        metadata: {
          type: 'presentation',
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          size: file.size,
          format: 'PPTX',
        },
      };
    }
  }
}

/**
 * OpenDocument Parser
 */
class OpenDocumentParser implements ParserCapabilities {
  priority = 80;

  canParse(file: File | Blob): boolean {
    return (
      'name' in file &&
      (file.name.endsWith('.odt') || file.name.endsWith('.ods') || file.name.endsWith('.odp'))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    return {
      name: 'name' in file ? file.name : 'document',
      path: '',
      metadata: {
        type: 'document',
        mimeType: 'application/vnd.oasis.opendocument.text',
        size: file.size,
        format: 'OpenDocument',
      },
    };
  }
}

/**
 * Code File Parser
 */
class CodeFileParser implements ParserCapabilities {
  priority = 70;

  private codeExtensions = [
    'js',
    'jsx',
    'ts',
    'tsx',
    'py',
    'java',
    'c',
    'cpp',
    'cs',
    'go',
    'rs',
    'php',
    'rb',
    'swift',
    'kt',
    'scala',
    'r',
    'lua',
    'perl',
    'sh',
    'bash',
    'ps1',
    'dart',
    'vue',
    'svelte',
    'elm',
    'clj',
    'ex',
    'exs',
    'erl',
    'hrl',
  ];

  canParse(file: File | Blob): boolean {
    if ('name' in file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return this.codeExtensions.includes(ext || '');
    }
    return false;
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const text = await file.text();
    const language = this.detectLanguage(file);
    const analysis = this.analyzeCode(text, language);

    return {
      name: 'name' in file ? file.name : 'code.txt',
      path: '',
      content: text,
      metadata: {
        type: 'code',
        mimeType: 'text/plain',
        size: file.size,
        language,
        customMetadata: analysis,
      },
    };
  }

  private detectLanguage(file: File | Blob): string {
    if ('name' in file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const langMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        cs: 'csharp',
        go: 'go',
        rs: 'rust',
        php: 'php',
        rb: 'ruby',
        swift: 'swift',
        kt: 'kotlin',
      };
      return langMap[ext || ''] || ext || 'unknown';
    }
    return 'unknown';
  }

  private analyzeCode(text: string, language: string): any {
    const lines = text.split('\n');
    const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
    const commentLines = lines.filter(l => l.trim().startsWith('//')).length;

    // Extract imports/dependencies
    const imports: string[] = [];
    const importPatterns = [
      /import\s+.*?from\s+['"](.+?)['"]/g,
      /require\s*\(['"](.+?)['"]\)/g,
      /from\s+(.+?)\s+import/g,
      /import\s+(.+?)$/gm,
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        imports.push(match[1]);
      }
    }

    return {
      lines: lines.length,
      codeLines,
      commentLines,
      blankLines: lines.length - codeLines - commentLines,
      imports: Array.from(new Set(imports)),
      complexity: Math.min(1 + Math.floor(codeLines / 50), 10),
    };
  }
}

/**
 * JSON Parser
 */
class JsonParser implements ParserCapabilities {
  priority = 75;

  canParse(file: File | Blob): boolean {
    return file.type === 'application/json' || ('name' in file && file.name.endsWith('.json'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const text = await file.text();
    let structure;
    let isValid = true;

    try {
      structure = JSON.parse(text);
    } catch (_error) {
      isValid = false;
    }

    return {
      name: 'name' in file ? file.name : 'data.json',
      path: '',
      content: text,
      metadata: {
        type: 'data',
        mimeType: 'application/json',
        size: file.size,
        format: 'JSON',
        customMetadata: {
          valid: isValid,
          keys: structure && typeof structure === 'object' ? Object.keys(structure).length : 0,
        },
      },
      structure,
    };
  }
}

/**
 * XML Parser
 */
class XmlParser implements ParserCapabilities {
  priority = 75;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/xml' ||
      file.type === 'text/xml' ||
      ('name' in file && (file.name.endsWith('.xml') || file.name.endsWith('.svg')))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const text = await file.text();
    const isValid = text.startsWith('<?xml') || text.includes('<svg');

    return {
      name: 'name' in file ? file.name : 'data.xml',
      path: '',
      content: text,
      metadata: {
        type: 'data',
        mimeType: 'application/xml',
        size: file.size,
        format: 'XML',
        customMetadata: {
          valid: isValid,
        },
      },
    };
  }
}

/**
 * YAML Parser
 */
class YamlParser implements ParserCapabilities {
  priority = 75;

  canParse(file: File | Blob): boolean {
    return 'name' in file && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const text = await file.text();

    return {
      name: 'name' in file ? file.name : 'data.yaml',
      path: '',
      content: text,
      metadata: {
        type: 'data',
        mimeType: 'application/x-yaml',
        size: file.size,
        format: 'YAML',
      },
    };
  }
}

/**
 * Image Parser
 */
class ImageParser implements ParserCapabilities {
  priority = 80;

  canParse(file: File | Blob): boolean {
    return file.type.startsWith('image/');
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const url = URL.createObjectURL(file);
    const metadata = await this.extractImageMetadata(file, url);

    return {
      name: 'name' in file ? file.name : 'image',
      path: '',
      preview: url,
      metadata: {
        type: 'image',
        mimeType: file.type,
        size: file.size,
        format: file.type.split('/')[1]?.toUpperCase() || 'IMAGE',
        dimensions: metadata.dimensions,
        customMetadata: metadata.exif,
      },
    };
  }

  private extractImageMetadata(file: File | Blob, url: string): Promise<any> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        resolve({
          dimensions: {
            width: img.width,
            height: img.height,
          },
          exif: {}, // Would need EXIF library for full metadata
        });
      };
      img.onerror = () => {
        resolve({});
      };
      img.src = url;
    });
  }
}

/**
 * SVG Parser
 */
class SvgParser implements ParserCapabilities {
  priority = 85;

  canParse(file: File | Blob): boolean {
    return file.type === 'image/svg+xml' || ('name' in file && file.name.endsWith('.svg'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const text = await file.text();

    // Extract viewBox dimensions
    const viewBoxMatch = text.match(/viewBox="([\d\s.-]+)"/);
    let dimensions;
    if (viewBoxMatch) {
      const [x, y, width, height] = viewBoxMatch[1].split(/\s+/).map(Number);
      dimensions = { width, height };
    }

    return {
      name: 'name' in file ? file.name : 'image.svg',
      path: '',
      content: text,
      metadata: {
        type: 'image',
        mimeType: 'image/svg+xml',
        size: file.size,
        format: 'SVG',
        dimensions,
      },
    };
  }
}

/**
 * Photoshop Parser (PSD)
 */
class PhotoshopParser implements ParserCapabilities {
  priority = 75;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'image/vnd.adobe.photoshop' || ('name' in file && file.name.endsWith('.psd'))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Check PSD signature
    const signature = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3)
    );

    let metadata: any = {};
    if (signature === '8BPS') {
      // Extract basic PSD info
      metadata.version = view.getUint16(4);
      metadata.channels = view.getUint16(12);
      metadata.height = view.getUint32(14);
      metadata.width = view.getUint32(18);
      metadata.depth = view.getUint16(22);
      metadata.colorMode = view.getUint16(24);
    }

    return {
      name: 'name' in file ? file.name : 'image.psd',
      path: '',
      metadata: {
        type: 'image',
        mimeType: 'image/vnd.adobe.photoshop',
        size: file.size,
        format: 'PSD',
        dimensions:
          metadata.width && metadata.height
            ? { width: metadata.width, height: metadata.height }
            : undefined,
        customMetadata: metadata,
      },
    };
  }
}

/**
 * Video Parser
 */
class VideoParser implements ParserCapabilities {
  priority = 70;

  canParse(file: File | Blob): boolean {
    return file.type.startsWith('video/');
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const url = URL.createObjectURL(file);
    const metadata = await this.extractVideoMetadata(url);

    return {
      name: 'name' in file ? file.name : 'video',
      path: '',
      preview: url,
      metadata: {
        type: 'video',
        mimeType: file.type,
        size: file.size,
        format: file.type.split('/')[1]?.toUpperCase() || 'VIDEO',
        duration: metadata.duration,
        dimensions: metadata.dimensions,
      },
    };
  }

  private extractVideoMetadata(url: string): Promise<any> {
    return new Promise(resolve => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight,
          },
        });
      };
      video.onerror = () => {
        resolve({});
      };
      video.src = url;
    });
  }
}

/**
 * Audio Parser
 */
class AudioParser implements ParserCapabilities {
  priority = 70;

  canParse(file: File | Blob): boolean {
    return file.type.startsWith('audio/');
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const url = URL.createObjectURL(file);
    const metadata = await this.extractAudioMetadata(url);

    return {
      name: 'name' in file ? file.name : 'audio',
      path: '',
      preview: url,
      metadata: {
        type: 'audio',
        mimeType: file.type,
        size: file.size,
        format: file.type.split('/')[1]?.toUpperCase() || 'AUDIO',
        duration: metadata.duration,
      },
    };
  }

  private extractAudioMetadata(url: string): Promise<any> {
    return new Promise(resolve => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve({
          duration: audio.duration,
        });
      };
      audio.onerror = () => {
        resolve({});
      };
      audio.src = url;
    });
  }
}

/**
 * SQLite Parser
 */
class SqliteParser implements ParserCapabilities {
  priority = 70;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/x-sqlite3' ||
      ('name' in file && (file.name.endsWith('.db') || file.name.endsWith('.sqlite')))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer();
    const view = new Uint8Array(buffer);

    // Check SQLite signature
    const signature = new TextDecoder().decode(view.slice(0, 16));
    const isSqlite = signature.startsWith('SQLite format');

    return {
      name: 'name' in file ? file.name : 'database.db',
      path: '',
      metadata: {
        type: 'database',
        mimeType: 'application/x-sqlite3',
        size: file.size,
        format: 'SQLite',
        customMetadata: {
          valid: isSqlite,
        },
      },
    };
  }
}

/**
 * CSV Parser
 */
class CsvParser implements ParserCapabilities {
  priority = 75;

  canParse(file: File | Blob): boolean {
    return file.type === 'text/csv' || ('name' in file && file.name.endsWith('.csv'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0]?.split(',').map(h => h.trim());

    return {
      name: 'name' in file ? file.name : 'data.csv',
      path: '',
      content: text,
      metadata: {
        type: 'data',
        mimeType: 'text/csv',
        size: file.size,
        format: 'CSV',
        customMetadata: {
          rows: lines.length - 1,
          columns: headers?.length || 0,
          headers,
        },
      },
    };
  }
}

/**
 * Executable Parser
 */
class ExecutableParser implements ParserCapabilities {
  priority = 60;

  canParse(file: File | Blob): boolean {
    return (
      file.type === 'application/x-msdownload' || ('name' in file && file.name.endsWith('.exe'))
    );
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Check PE signature
    const mz = String.fromCharCode(view.getUint8(0), view.getUint8(1));
    const isPE = mz === 'MZ';

    return {
      name: 'name' in file ? file.name : 'program.exe',
      path: '',
      metadata: {
        type: 'executable',
        mimeType: 'application/x-msdownload',
        size: file.size,
        format: 'EXE',
        customMetadata: {
          validPE: isPE,
        },
      },
      warnings: ['Executable file detected. Exercise caution when handling.'],
    };
  }
}

/**
 * DLL Parser
 */
class DllParser implements ParserCapabilities {
  priority = 60;

  canParse(file: File | Blob): boolean {
    return 'name' in file && file.name.endsWith('.dll');
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    return {
      name: 'name' in file ? file.name : 'library.dll',
      path: '',
      metadata: {
        type: 'library',
        mimeType: 'application/x-msdownload',
        size: file.size,
        format: 'DLL',
      },
    };
  }
}

/**
 * WebAssembly Parser
 */
class WasmParser implements ParserCapabilities {
  priority = 65;

  canParse(file: File | Blob): boolean {
    return file.type === 'application/wasm' || ('name' in file && file.name.endsWith('.wasm'));
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer();
    const view = new DataView(buffer);

    // Check WASM signature (0x00 0x61 0x73 0x6D)
    const signature = view.getUint32(0);
    const isWasm = signature === 0x0061736d;

    return {
      name: 'name' in file ? file.name : 'module.wasm',
      path: '',
      metadata: {
        type: 'wasm',
        mimeType: 'application/wasm',
        size: file.size,
        format: 'WebAssembly',
        customMetadata: {
          valid: isWasm,
          version: isWasm ? view.getUint32(4) : undefined,
        },
      },
    };
  }
}

/**
 * Fallback Parser for unknown file types
 */
class FallbackParser implements ParserCapabilities {
  priority = 0; // Lowest priority

  canParse(): boolean {
    return true; // Can parse anything
  }

  async parse(file: File | Blob): Promise<ParsedFile> {
    const isBinary = await this.isBinary(file);
    let content;
    let extractedText;

    if (!isBinary) {
      try {
        content = await file.text();
        extractedText = content.substring(0, 1000);
      } catch {
        // File is binary
      }
    }

    return {
      name: 'name' in file ? file.name : 'unknown',
      path: '',
      content,
      extractedText,
      metadata: {
        type: isBinary ? 'binary' : 'text',
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        format: 'Unknown',
      },
      warnings: ['File type not recognized. Basic analysis performed.'],
    };
  }

  private async isBinary(file: File | Blob): Promise<boolean> {
    const slice = file.slice(0, 1024);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for null bytes (common in binary files)
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0) return true;
    }

    // Check for high percentage of non-printable characters
    let nonPrintable = 0;
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] < 32 && bytes[i] !== 9 && bytes[i] !== 10 && bytes[i] !== 13) {
        nonPrintable++;
      }
    }

    return nonPrintable / bytes.length > 0.3;
  }
}

// Export singleton parser
export const fileParser = new UniversalFileParser();
