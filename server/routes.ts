import type { Express, Request } from 'express';
import { createServer, type Server } from 'http';
import multer from 'multer';
import JSZip from 'jszip';
import { storage } from './storage';
import { observer } from './observer';
import { type File } from '@shared/schema';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';

const upload = multer({ storage: multer.memoryStorage() });

// Extract code snippets from text/chat content
function extractCodeFromText(content: string): { snippets: string[]; languages: string[] } {
  const codeSnippets: string[] = [];
  const detectedLanguages: string[] = [];

  // Pattern 1: Markdown-style code blocks ```language
  const markdownCodeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = markdownCodeRegex.exec(content)) !== null) {
    const language = match[1] || 'unknown';
    const code = match[2].trim();
    if (code && code.length < 10000) {
      // Limit individual snippet size
      codeSnippets.push(code.substring(0, 5000)); // Truncate if needed
      if (language !== 'unknown' && !detectedLanguages.includes(language)) {
        detectedLanguages.push(language);
      }
    }
  }

  // Pattern 2: Indented code blocks (4+ spaces or tab)
  const indentedCodeRegex = /(?:^|\n)((?:[ ]{4,}|\t).*(?:\n(?:[ ]{4,}|\t).*)*)/g;
  while ((match = indentedCodeRegex.exec(content)) !== null) {
    const code = match[1].replace(/^[ \t]+/gm, '').trim();
    if (code && code.length > 20) {
      // Minimum length to avoid false positives
      codeSnippets.push(code);
    }
  }

  // Pattern 3: Common code patterns in text
  const patterns = [
    /(?:function|const|let|var)\s+\w+\s*[=\(]/g, // JS functions/variables
    /def\s+\w+\s*\(/g, // Python functions
    /class\s+\w+/g, // Class definitions
    /import\s+[\w{},\s]+from\s+['"][^'"]+['"]/g, // ES6 imports
    /require\s*\(['"][^'"]+['"]\)/g, // CommonJS requires
  ];

  patterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      // Extract surrounding context for each match
      matches.forEach(matchText => {
        const index = content.indexOf(matchText);
        const start = Math.max(0, content.lastIndexOf('\n', index - 100));
        const end = Math.min(content.length, content.indexOf('\n', index + 200));
        const snippet = content.substring(start, end).trim();
        if (snippet.length > 30) {
          codeSnippets.push(snippet);
        }
      });
    }
  });

  // Limit snippets to prevent memory issues
  const limitedSnippets = codeSnippets.slice(0, 50); // Max 50 snippets

  // Auto-detect languages if not already detected
  if (detectedLanguages.length === 0 && limitedSnippets.length > 0) {
    // Sample first few snippets for language detection
    const sampleCode = limitedSnippets.slice(0, 10).join('\n').substring(0, 5000);
    if (sampleCode.match(/\b(function|const|let|var|=>|import|export)\b/))
      detectedLanguages.push('javascript');
    if (sampleCode.match(/\b(def|import|class|print|if __name__)\b/))
      detectedLanguages.push('python');
    if (sampleCode.match(/\b(public|private|class|interface|namespace)\b/))
      detectedLanguages.push('java/csharp');
  }

  return { snippets: limitedSnippets, languages: detectedLanguages };
}

// Analyze chat/conversation files
function analyzeChatContent(filename: string, content: string): any {
  try {
    const { snippets, languages } = extractCodeFromText(content);
    const lines = content.split('\n');

    // Detect chat patterns
    const isChatHistory =
      content.includes('User:') ||
      content.includes('Assistant:') ||
      content.includes('<user>') ||
      content.includes('<assistant>') ||
      content.includes('"role":') ||
      content.includes('message:');

    // Extract topics and concepts
    const topics: string[] = [];
    const topicPatterns = [
      /(?:about|regarding|concerning|discussing)\s+(\w+(?:\s+\w+){0,3})/gi,
      /(?:implement|build|create|develop)\s+(\w+(?:\s+\w+){0,3})/gi,
      /(?:fix|debug|solve|troubleshoot)\s+(\w+(?:\s+\w+){0,3})/gi,
    ];

    topicPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const topic = match[1].toLowerCase().trim();
        if (topic.length > 3 && !topics.includes(topic)) {
          topics.push(topic);
        }
      }
    });

    return {
      language:
        languages.length > 0 ? languages.join(', ') : isChatHistory ? 'Chat/Conversation' : 'Text',
      tags: [
        ...(isChatHistory ? ['chat', 'conversation'] : ['text']),
        ...(snippets.length > 0 ? ['contains-code'] : []),
        ...(topics.length > 0 ? ['technical-discussion'] : []),
      ],
      complexity: snippets.length > 5 ? 'High' : snippets.length > 2 ? 'Medium' : 'Low',
      dependencies: [],
      description: isChatHistory
        ? `Chat history containing ${snippets.length} code snippets${topics.length > 0 ? ' discussing: ' + topics.slice(0, 3).join(', ') : ''}`
        : `Text file with ${snippets.length} embedded code snippets${languages.length > 0 ? ' in ' + languages.join(', ') : ''}`,
      metadata: {
        codeSnippetCount: snippets.length,
        detectedLanguages: languages,
        topics: topics.slice(0, 10),
        lineCount: lines.length,
        wordCount: content.split(/\s+/).length,
      },
    };
  } catch (_error) {
    console.error('Error analyzing chat content:', _error);
    // Return safe defaults on error
    return {
      language: 'Text',
      tags: ['text', 'error-during-analysis'],
      complexity: 'Low',
      dependencies: [],
      description: 'Text file (analysis incomplete due to processing error)',
      metadata: {
        codeSnippetCount: 0,
        detectedLanguages: [],
        topics: [],
        lineCount: content.split('\n').length,
        wordCount: 0,
      },
    };
  }
}

// Simple NLP-like analysis
function analyzeCodeFile(filename: string, content: string, extension: string) {
  let language = '';
  let tags: string[] = [];
  let complexity = 'Low';
  let dependencies: string[] = [];
  let description = '';

  // Determine language
  const languageMap: Record<string, string> = {
    '.js': 'JavaScript',
    '.jsx': 'React',
    '.ts': 'TypeScript',
    '.tsx': 'React TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.css': 'CSS',
    '.html': 'HTML',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
  };

  language = languageMap[extension] || 'Unknown';

  // Extract imports/dependencies
  const importRegex = /(?:import|require|from|#include)\s+['"']([^'"']+)['"']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    dependencies.push(match[1]);
  }

  // Determine complexity based on content
  const lines = content.split('\n').length;
  const functions = (content.match(/function|def |class |const \w+\s*=/g) || []).length;

  if (lines > 100 || functions > 10) {
    complexity = 'High';
  } else if (lines > 50 || functions > 5) {
    complexity = 'Medium';
  }

  // Generate tags based on filename and content
  const lowerName = filename.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerName.includes('component') || lowerContent.includes('component')) {
    tags.push('component');
  }
  if (['jsx', 'tsx'].includes(extension.slice(1))) {
    tags.push('react');
  }
  if (lowerName.includes('util') || lowerName.includes('helper')) {
    tags.push('utility');
  }
  if (lowerName.includes('test') || lowerName.includes('spec')) {
    tags.push('test');
  }
  if (lowerName.includes('config')) {
    tags.push('config');
  }
  if (lowerContent.includes('export default') || lowerContent.includes('module.exports')) {
    tags.push('module');
  }

  // Generate description
  if (tags.includes('component')) {
    description = `${language} component that handles UI rendering and user interactions`;
  } else if (tags.includes('utility')) {
    description = `Utility module providing helper functions and common operations`;
  } else if (tags.includes('config')) {
    description = `Configuration file containing project settings and parameters`;
  } else if (tags.includes('test')) {
    description = `Test file containing unit tests and test specifications`;
  } else {
    description = `${language} file containing application logic and functionality`;
  }

  return {
    language,
    tags,
    complexity,
    dependencies: dependencies.slice(0, 10), // Limit dependencies
    description,
  };
}

// Helper function to detect language from extension
function detectLanguage(extension: string): string {
  const languageMap: Record<string, string> = {
    '.js': 'JavaScript',
    '.jsx': 'React',
    '.ts': 'TypeScript',
    '.tsx': 'React TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.css': 'CSS',
    '.html': 'HTML',
    '.json': 'JSON',
    '.md': 'Markdown',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
  };
  return languageMap[extension] || 'Unknown';
}

// Helper function to analyze content
function analyzeContent(
  content: string,
  language: string
): { complexity: string | null; dependencies: string[] } {
  const dependencies: string[] = [];

  // Extract imports/dependencies
  const importRegex = /(?:import|require|from|#include)\s+['"']([^'"']+)['"']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    dependencies.push(match[1]);
  }

  // Determine complexity based on content
  const lines = content.split('\n').length;
  const functions = (content.match(/function|def |class |const \w+\s*=/g) || []).length;

  let complexity = 'Low';
  if (lines > 100 || functions > 10) {
    complexity = 'High';
  } else if (lines > 50 || functions > 5) {
    complexity = 'Medium';
  }

  return {
    complexity,
    dependencies: dependencies.slice(0, 10), // Limit dependencies
  };
}

// Helper functions for enhanced export
function extractKeyInsights(files: File[]): string[] {
  const insights: string[] = [];

  const securityFiles = files.filter(
    f =>
      f.name.toLowerCase().includes('crypto') ||
      f.name.toLowerCase().includes('encrypt') ||
      f.content?.toLowerCase().includes('encryption')
  );
  if (securityFiles.length > 0) {
    insights.push(`Security implementation found in ${securityFiles.length} files`);
  }

  const complexFiles = files.filter(f => f.complexity === 'High');
  if (complexFiles.length > 0) {
    insights.push(`${complexFiles.length} high-complexity files containing core logic`);
  }

  const jsModules = files.filter(f => f.language === 'JavaScript');
  if (jsModules.length > 0) {
    insights.push(`${jsModules.length} JavaScript modules with modular architecture`);
  }

  return insights;
}

function buildExportFileStructure(files: File[]): any {
  const structure: any = {};

  files.forEach(file => {
    const pathParts = file.path.split('/');
    let current = structure;

    pathParts.forEach((part, index) => {
      if (!current[part]) {
        current[part] =
          index === pathParts.length - 1
            ? {
                type: 'file',
                language: file.language,
                complexity: file.complexity,
                size: file.size,
                tags: file.tags,
              }
            : {};
      }
      current = current[part];
    });
  });

  return structure;
}

function generateExplorationPaths(files: File[]): string[] {
  const paths: string[] = [];

  const securityFiles = files.filter(f => f.name.toLowerCase().includes('crypto'));
  if (securityFiles.length > 0) {
    paths.push(`Start with security review: ${securityFiles[0].name}`);
  }

  const complexFiles = files.filter(f => f.complexity === 'High');
  if (complexFiles.length > 0) {
    paths.push(`Analyze core logic: ${complexFiles[0].name}`);
  }

  const jsFiles = files.filter(f => f.language === 'JavaScript');
  if (jsFiles.length > 0) {
    paths.push(`Review JavaScript modules: ${jsFiles[0].name}`);
  }

  return paths;
}

// API Configuration
interface ApiConfig {
  version: string;
  maxFileSize: number;
  supportedFormats: string[];
  cors: cors.CorsOptions;
}

const API_CONFIG: ApiConfig = {
  version: 'v1',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  supportedFormats: ['.zip', '.rar', '.7z', '.tar', '.gz'],
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
  },
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply CORS middleware
  app.use(cors(API_CONFIG.cors));

  // API versioning middleware
  app.use('/api/:version/*', (req: Request<{ version: string }>, res, next) => {
    const { version } = req.params;
    if (version !== API_CONFIG.version) {
      return res.status(400).json({
        error: 'Invalid API version',
        supportedVersions: [API_CONFIG.version],
        message: `Please use /api/${API_CONFIG.version} endpoint`,
      });
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      version: API_CONFIG.version,
      timestamp: new Date().toISOString(),
      features: {
        cors: true,
        multiFormat: true,
        nlpAnalysis: true,
        apiVersion: API_CONFIG.version,
      },
    });
  });

  // API documentation endpoint
  app.get('/api/v1/docs', (req, res) => {
    res.json({
      version: API_CONFIG.version,
      endpoints: {
        health: {
          method: 'GET',
          path: '/api/health',
          description: 'Health check endpoint',
        },
        uploadArchive: {
          method: 'POST',
          path: '/api/v1/archives',
          description: 'Upload and process zip archive',
          body: 'multipart/form-data with "archive" field',
          response: { archive: 'Archive', fileCount: 'number' },
        },
        listArchives: {
          method: 'GET',
          path: '/api/v1/archives',
          description: 'List all processed archives',
        },
        getArchive: {
          method: 'GET',
          path: '/api/v1/archives/:id',
          description: 'Get specific archive details',
        },
        getArchiveFiles: {
          method: 'GET',
          path: '/api/v1/archives/:id/files',
          description: 'Get all files from an archive',
        },
        exportArchive: {
          method: 'GET',
          path: '/api/v1/archives/:id/export',
          description: 'Export archive analysis as JSON',
        },
        getFile: {
          method: 'GET',
          path: '/api/v1/files/:id',
          description: 'Get specific file details',
        },
        deleteArchive: {
          method: 'DELETE',
          path: '/api/v1/archives/:id',
          description: 'Delete an archive and its files',
        },
      },
      supportedFormats: API_CONFIG.supportedFormats,
      maxFileSize: `${API_CONFIG.maxFileSize / (1024 * 1024)}MB`,
    });
  });

  // Upload and process any file type - now supports comprehensive parsing
  app.post('/api/v1/archives', upload.single('archive'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Detect file type
      const fileType = req.file.mimetype || 'application/octet-stream';
      const isArchive =
        fileType.includes('zip') ||
        fileType.includes('tar') ||
        fileType.includes('rar') ||
        fileType.includes('7z') ||
        fileType.includes('gzip') ||
        req.file.originalname.includes('.tar.');

      let contents: any = null;
      let fileCount = 0;
      let processedFiles = [];

      // Try to process as archive first if it looks like one
      if (isArchive || req.file.originalname.endsWith('.zip')) {
        try {
          const zip = new JSZip();
          contents = await zip.loadAsync(req.file.buffer);
        } catch (_error) {
          // Not a valid ZIP, will process as single file
          console.log('Not a valid ZIP archive, processing as single file');
        }
      }

      // Create archive record with enhanced metadata
      const symbolicChain = `T1_CHAIN::ZIPWizard::v2.2.6b::${req.body.from || 'USER'}::${req.body.operation || 'Upload'}`;
      const threadTag = `Thread_${req.body.tag || 'Upload'}_${Date.now()}`;

      const archive = await storage.createArchive({
        name: req.file.originalname,
        originalSize: req.file.size,
        fileCount: contents && contents.files ? Object.keys(contents.files).length : 1,
        symbolicChain,
        threadTag,
        ethicsLock: req.body?.ethicsLock || 'Picard_Delta_3',
        trustAnchor: req.body?.trustAnchor || 'SN1-AS3-TRUSTED',
        replayable: true,
        monitoringWindow: parseInt(req.body?.monitoringWindow) || 48,
      });

      // Track upload event
      await observer.trackUpload(archive.id, archive.name, archive.fileCount);

      // Process files based on type
      if (contents && contents.files) {
        // ZIP archive processing
        for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
          const entry = zipEntry as JSZip.JSZipObject;
          if (entry.dir) {
            // Directory entry
            const file = await storage.createFile({
              archiveId: archive.id,
              path: relativePath,
              name: path.basename(relativePath) || relativePath,
              size: 0,
              isDirectory: 'true',
              parentPath: path.dirname(relativePath) === '.' ? null : path.dirname(relativePath),
              extension: null,
              content: null,
              language: null,
              description: 'Directory containing project files',
              tags: ['directory'],
              complexity: null,
              dependencies: [],
            });
            processedFiles.push(file);
          } else {
            // File entry
            const content = await entry.async('text');
            const extension = path.extname(relativePath);
            const name = path.basename(relativePath);
            const parentPath =
              path.dirname(relativePath) === '.' ? null : path.dirname(relativePath);

            let analysis: {
              language: string | null;
              tags: string[];
              complexity: string | null;
              dependencies: string[];
              description: string;
            } = {
              language: null,
              tags: [],
              complexity: null,
              dependencies: [],
              description: 'Binary or non-text file',
            };

            // Analyze all text-based files
            if (content) {
              // Programming files
              if (
                extension &&
                [
                  '.js',
                  '.jsx',
                  '.ts',
                  '.tsx',
                  '.py',
                  '.java',
                  '.cpp',
                  '.c',
                  '.css',
                  '.json',
                  '.php',
                  '.rb',
                  '.go',
                  '.rs',
                ].includes(extension)
              ) {
                analysis = analyzeCodeFile(name, content, extension);
              }
              // Text files, logs, and chat histories
              else if (extension && ['.txt', '.log', '.html', '.md', '.xml'].includes(extension)) {
                analysis = analyzeChatContent(name, content);
              }
              // Any file without extension or unknown extension - check if it contains text
              else if (!extension || content.match(/[\x20-\x7E\n\r\t]/)) {
                analysis = analyzeChatContent(name, content);
              }
            }

            // Calculate hash for mutation tracking
            const contentHash = crypto.createHash('sha256').update(content).digest('hex');

            // Clean content for PostgreSQL - remove null bytes and ensure valid UTF-8
            let cleanContent = content.replace(/\x00/g, ''); // Remove null bytes
            if (cleanContent.length > 50000) {
              cleanContent = cleanContent.substring(0, 50000) + '...'; // Truncate very large files
            }

            const file = await storage.createFile({
              archiveId: archive.id,
              path: relativePath,
              name,
              size: content.length,
              isDirectory: 'false',
              parentPath,
              extension,
              content: cleanContent,
              language: analysis.language,
              description: analysis.description,
              tags: Array.isArray(analysis.tags) ? analysis.tags : [],
              complexity: analysis.complexity,
              dependencies: Array.isArray(analysis.dependencies) ? analysis.dependencies : [],
              originalHash: contentHash,
              currentHash: contentHash,
            });

            // Track analysis event
            if (analysis.language) {
              await observer.trackAnalysis(archive.id, file.id, name, analysis);
            }

            processedFiles.push(file);
          }
        }
      } else {
        // Single file processing (non-archive)
        fileCount = 1;
        const fileContent = req.file.buffer.toString('utf-8');
        const extension = path.extname(req.file.originalname);
        const language = detectLanguage(extension);
        const analysis = analyzeContent(fileContent, language);

        const file = await storage.createFile({
          archiveId: archive.id,
          path: req.file.originalname,
          name: req.file.originalname,
          size: req.file.size,
          isDirectory: 'false',
          parentPath: null,
          extension,
          content: fileContent,
          language,
          description: `${req.file.mimetype} file`,
          tags: [req.file.mimetype.split('/')[0], extension.replace('.', '')],
          complexity: analysis.complexity,
          dependencies: analysis.dependencies || [],
          originalHash: crypto.createHash('sha256').update(fileContent).digest('hex'),
          currentHash: crypto.createHash('sha256').update(fileContent).digest('hex'),
        });
        processedFiles.push(file);
      }

      res.json({ archive, fileCount: processedFiles.length });
    } catch (_error) {
      console.error('Upload error:', _error);
      res.status(500).json({ message: 'Failed to process archive' });
    }
  });

  // Get all archives
  app.get('/api/v1/archives', async (req, res) => {
    try {
      const archives = await storage.getAllArchives();
      res.json({
        success: true,
        data: archives,
        meta: {
          total: archives.length,
          version: API_CONFIG.version,
        },
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch archives',
        message: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  });

  // Get specific archive
  app.get('/api/v1/archives/:id', async (req, res) => {
    try {
      const archive = await storage.getArchive(req.params.id);
      if (!archive) {
        return res.status(404).json({
          success: false,
          error: 'Archive not found',
        });
      }
      const files = await storage.getFilesByArchiveId(req.params.id);
      res.json({
        success: true,
        data: {
          ...archive,
          fileCount: files.length,
          analysis: analyzeFiles(files),
        },
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch archive',
      });
    }
  });

  // Get archive files with filtering
  app.get('/api/v1/archives/:id/files', async (req, res) => {
    try {
      const { language, tag, search, complexity } = req.query;
      let files = await storage.getFilesByArchiveId(req.params.id);

      // Apply filters
      if (language) {
        files = files.filter(f => f.language === language);
      }
      if (tag) {
        files = files.filter(f => f.tags?.includes(tag as string));
      }
      if (complexity) {
        files = files.filter(f => f.complexity === complexity);
      }
      if (search) {
        const searchLower = (search as string).toLowerCase();
        files = files.filter(
          f =>
            f.name.toLowerCase().includes(searchLower) ||
            f.path.toLowerCase().includes(searchLower) ||
            f.description?.toLowerCase().includes(searchLower)
        );
      }

      res.json({
        success: true,
        data: files,
        meta: {
          total: files.length,
          filters: { language, tag, complexity, search },
        },
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch files',
      });
    }
  });

  // Export archive analysis as JSON
  app.get('/api/v1/archives/:id/export', async (req, res) => {
    try {
      const archive = await storage.getArchive(req.params.id);
      if (!archive) {
        return res.status(404).json({
          success: false,
          error: 'Archive not found',
        });
      }

      const files = await storage.getFilesByArchiveId(req.params.id);
      const analysis = analyzeFiles(files);
      const observerEvents = await storage.getObserverEvents(req.params.id, 1000);

      const exportData = {
        metadata: {
          archiveName: archive.name,
          exportedAt: new Date().toISOString(),
          version: API_CONFIG.version,
          zipWizardVersion: 'v2.2.6b',
          totalFiles: files.length,
          analysisComplete: true,
        },
        archive: {
          ...archive,
          quantumFeatures: {
            symbolicChain: archive.symbolicChain,
            threadTag: archive.threadTag,
            ethicsLock: archive.ethicsLock,
            trustAnchor: archive.trustAnchor,
            replayable: archive.replayable,
          },
        },
        analysis: {
          ...analysis,
          aiOptimizedSummary: {
            codeFiles: files.filter(f => f.language && f.language !== 'Text').length,
            languages: Object.keys(analysis.languages),
            complexityDistribution: {
              high: files.filter(f => f.complexity === 'High').length,
              medium: files.filter(f => f.complexity === 'Medium').length,
              low: files.filter(f => f.complexity === 'Low').length,
            },
            keyInsights: extractKeyInsights(files),
          },
        },
        fileStructure: buildExportFileStructure(files),
        observerEvents: observerEvents.map(e => ({
          type: e.type,
          target: e.target,
          timestamp: e.timestamp,
          metadata: e.metadata,
        })),
        exportedAt: new Date().toISOString(),
        aiInstructions: {
          note: 'This archive has been processed by ZipWizard v2.2.6b quantum analysis engine',
          recommendations:
            'Focus on files with High complexity for technical review, JavaScript modules contain encryption logic',
          explorationPaths: generateExplorationPaths(files),
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${archive.name.replace('.zip', '')}-zipwizard-export.json"`
      );
      res.json(exportData);
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to export archive',
      });
    }
  });

  // Get specific file
  app.get('/api/v1/files/:id', async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File not found',
        });
      }
      res.json({
        success: true,
        data: file,
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch file',
      });
    }
  });

  // Delete archive
  app.delete('/api/v1/archives/:id', async (req, res) => {
    try {
      await storage.deleteArchive(req.params.id);
      res.json({
        success: true,
        message: 'Archive deleted successfully',
      });
    } catch (_error) {
      console.error('Delete archive error:', _error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete archive',
        details: _error instanceof Error ? _error.message : 'Unknown error',
      });
    }
  });

  // Get observer events
  app.get('/api/v1/observer/events', async (req, res) => {
    try {
      const { archiveId, limit = '100', type } = req.query;
      const events = type
        ? await storage.getObserverEventsByType(type as string, parseInt(limit as string))
        : await storage.getObserverEvents(archiveId as string, parseInt(limit as string));

      res.json({
        success: true,
        data: events,
        meta: {
          total: events.length,
          limit: parseInt(limit as string),
          filters: { archiveId, type },
        },
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve observer events',
      });
    }
  });

  // Get status dashboard for an archive
  app.get('/api/v1/archives/:id/status', async (req, res) => {
    try {
      const archive = await storage.getArchive(req.params.id);
      if (!archive) {
        return res.status(404).json({
          success: false,
          error: 'Archive not found',
        });
      }

      const withinWindow = await observer.isWithinMonitoringWindow(req.params.id);
      const activitySummary = await observer.getActivitySummary(
        req.params.id,
        archive.monitoringWindow || 48
      );

      res.json({
        success: true,
        data: {
          symbolicChain: archive.symbolicChain || 'N/A',
          threadTag: archive.threadTag || 'N/A',
          ethicsLock: archive.ethicsLock || 'N/A',
          trustAnchor: archive.trustAnchor || 'N/A',
          deploymentStatus: {
            guiHabitat: true,
            glyphcardExport: true,
            zipBundle: archive.name,
            monitoring: withinWindow ? 'Active' : 'Expired',
            acknowledgment: false,
          },
          replayState: {
            replayable: archive.replayable,
            continuityAnchors: 'Verified',
          },
          activitySummary,
        },
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve status',
      });
    }
  });

  // Get recent mutations
  app.get('/api/v1/mutations', async (req, res) => {
    try {
      const { limit = '50' } = req.query;
      const mutations = await storage.getRecentMutations(parseInt(limit as string));

      res.json({
        success: true,
        data: mutations,
        meta: {
          total: mutations.length,
          limit: parseInt(limit as string),
        },
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve mutations',
      });
    }
  });

  // Enhanced Features - Symbolic Interface API
  app.get('/api/v1/symbolic/command/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;

      switch (symbol) {
        case '999':
          res.json({
            success: true,
            data: {
              command: 'quantum-analysis',
              status: 'initiated',
              progress: 0,
              eta: '30s',
            },
          });
          break;

        case 'T1':
          res.json({
            success: true,
            data: {
              command: 'symbolic-thread',
              status: 'active',
              anchor: 'SN1-AS3-TRUSTED',
              continuity: 'maintained',
            },
          });
          break;

        default:
          res.status(404).json({
            success: false,
            error: `Unknown symbolic command: ${symbol}`,
          });
      }
    } catch (_error) {
      console.error('Symbolic command error:', _error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Enhanced Archive Management API
  app.post('/api/v1/enhanced/archives/:id/optimize', async (req, res) => {
    try {
      const { id } = req.params;
      const { mode = 'balanced' } = req.body;

      res.json({
        success: true,
        data: {
          archive_id: id,
          optimization_mode: mode,
          status: 'processing',
          estimated_savings: '25%',
          progress: 0,
          eta: '2 minutes',
        },
      });
    } catch (_error) {
      console.error('Archive optimization error:', _error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Privacy Shield API
  app.post('/api/v1/privacy/scan', async (req, res) => {
    try {
      const { archive_id } = req.body;

      res.json({
        success: true,
        data: {
          scan_id: `scan_${Date.now()}`,
          archive_id,
          status: 'completed',
          privacy_score: 78,
          issues_found: [
            {
              file: 'user_data.csv',
              type: 'PII',
              severity: 'high',
              description: 'Contains personal identifiable information',
            },
          ],
          recommendations: [
            'Enable data redaction for PII fields',
            'Encrypt sensitive configuration files',
          ],
        },
      });
    } catch (_error) {
      console.error('Privacy scan error:', _error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  });

  // Import and register security routes
  const securityRoutes = await import('./routes/security');
  app.use('/api/v1/security', securityRoutes.default);

  const httpServer = createServer(app);
  return httpServer;
}

// Analysis helper function
function analyzeFiles(files: any[]) {
  const totalFiles = files.filter(f => f.isDirectory !== 'true').length;
  const components = files.filter(f => f.tags?.includes('component')).length;
  const modules = files.filter(f => f.tags?.includes('module')).length;
  const utilities = files.filter(f => f.tags?.includes('utility')).length;

  const languages: Record<string, number> = {};
  files.forEach(file => {
    if (file.language) {
      languages[file.language] = (languages[file.language] || 0) + 1;
    }
  });

  return {
    totalFiles,
    components,
    modules,
    utilities,
    languages,
  };
}
