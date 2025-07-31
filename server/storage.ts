import { type Archive, type InsertArchive, type File, type InsertFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Archive operations
  createArchive(archive: InsertArchive): Promise<Archive>;
  getArchive(id: string): Promise<Archive | undefined>;
  getAllArchives(): Promise<Archive[]>;
  deleteArchive(id: string): Promise<void>;
  
  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFilesByArchiveId(archiveId: string): Promise<File[]>;
  getFile(id: string): Promise<File | undefined>;
  getFileByPath(archiveId: string, path: string): Promise<File | undefined>;
  updateFile(id: string, updates: Partial<File>): Promise<File | undefined>;
  deleteFilesByArchiveId(archiveId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private archives: Map<string, Archive>;
  private files: Map<string, File>;

  constructor() {
    this.archives = new Map();
    this.files = new Map();
  }

  async createArchive(insertArchive: InsertArchive): Promise<Archive> {
    const id = randomUUID();
    const archive: Archive = { 
      ...insertArchive, 
      id,
      uploadedAt: new Date()
    };
    this.archives.set(id, archive);
    return archive;
  }

  async getArchive(id: string): Promise<Archive | undefined> {
    return this.archives.get(id);
  }

  async getAllArchives(): Promise<Archive[]> {
    return Array.from(this.archives.values());
  }

  async deleteArchive(id: string): Promise<void> {
    this.archives.delete(id);
    // Also delete associated files
    await this.deleteFilesByArchiveId(id);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = randomUUID();
    const file: File = { ...insertFile, id };
    this.files.set(id, file);
    return file;
  }

  async getFilesByArchiveId(archiveId: string): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.archiveId === archiveId
    );
  }

  async getFile(id: string): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFileByPath(archiveId: string, path: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(
      (file) => file.archiveId === archiveId && file.path === path
    );
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File | undefined> {
    const file = this.files.get(id);
    if (!file) return undefined;
    
    const updatedFile = { ...file, ...updates };
    this.files.set(id, updatedFile);
    return updatedFile;
  }

  async deleteFilesByArchiveId(archiveId: string): Promise<void> {
    for (const [id, file] of this.files.entries()) {
      if (file.archiveId === archiveId) {
        this.files.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();
