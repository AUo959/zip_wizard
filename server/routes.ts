import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import * as JSZip from "jszip";
import { storage } from "./storage";
import { insertArchiveSchema, insertFileSchema } from "@shared/schema";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });

// Simple NLP-like analysis
function analyzeCodeFile(filename: string, content: string, extension: string) {
  let language = "";
  let tags: string[] = [];
  let complexity = "Low";
  let dependencies: string[] = [];
  let description = "";

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
    complexity = "High";
  } else if (lines > 50 || functions > 5) {
    complexity = "Medium";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload and process archive
  app.post("/api/archives/upload", upload.single("archive"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const zip = new JSZip();
      const contents = await zip.loadAsync(req.file.buffer);
      
      // Create archive record
      const archive = await storage.createArchive({
        name: req.file.originalname,
        originalSize: req.file.size,
        fileCount: Object.keys(contents.files).length,
      });

      // Process files
      const processedFiles = [];
      for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
        if (zipEntry.dir) {
          // Directory entry
          const file = await storage.createFile({
            archiveId: archive.id,
            path: relativePath,
            name: path.basename(relativePath) || relativePath,
            size: 0,
            isDirectory: "true",
            parentPath: path.dirname(relativePath) === '.' ? null : path.dirname(relativePath),
            extension: null,
            content: null,
            language: null,
            description: "Directory containing project files",
            tags: ['directory'],
            complexity: null,
            dependencies: [],
          });
          processedFiles.push(file);
        } else {
          // File entry
          const content = await zipEntry.async("text");
          const extension = path.extname(relativePath);
          const name = path.basename(relativePath);
          const parentPath = path.dirname(relativePath) === '.' ? null : path.dirname(relativePath);
          
          let analysis = { language: null, tags: [], complexity: null, dependencies: [], description: "Binary or non-text file" };
          
          // Only analyze text files
          if (content && extension && ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.css', '.html', '.json', '.md', '.php', '.rb', '.go', '.rs'].includes(extension)) {
            analysis = analyzeCodeFile(name, content, extension);
          }

          const file = await storage.createFile({
            archiveId: archive.id,
            path: relativePath,
            name,
            size: content.length,
            isDirectory: "false",
            parentPath,
            extension,
            content: content.length > 50000 ? content.substring(0, 50000) + "..." : content, // Truncate very large files
            language: analysis.language,
            description: analysis.description,
            tags: analysis.tags,
            complexity: analysis.complexity,
            dependencies: analysis.dependencies,
          });
          processedFiles.push(file);
        }
      }

      res.json({ archive, fileCount: processedFiles.length });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to process archive" });
    }
  });

  // Get all archives
  app.get("/api/archives", async (req, res) => {
    try {
      const archives = await storage.getAllArchives();
      res.json(archives);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch archives" });
    }
  });

  // Get archive files
  app.get("/api/archives/:id/files", async (req, res) => {
    try {
      const files = await storage.getFilesByArchiveId(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  // Get specific file
  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  // Delete archive
  app.delete("/api/archives/:id", async (req, res) => {
    try {
      await storage.deleteArchive(req.params.id);
      res.json({ message: "Archive deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete archive" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
