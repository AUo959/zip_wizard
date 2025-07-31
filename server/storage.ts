import { archives, files, type Archive, type InsertArchive, type File, type InsertFile } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async createArchive(insertArchive: InsertArchive): Promise<Archive> {
    const [archive] = await db
      .insert(archives)
      .values([insertArchive])
      .returning();
    return archive;
  }

  async getArchive(id: string): Promise<Archive | undefined> {
    const [archive] = await db.select().from(archives).where(eq(archives.id, id));
    return archive || undefined;
  }

  async getAllArchives(): Promise<Archive[]> {
    return await db.select().from(archives);
  }

  async deleteArchive(id: string): Promise<void> {
    // Delete associated files first
    await this.deleteFilesByArchiveId(id);
    // Then delete the archive
    await db.delete(archives).where(eq(archives.id, id));
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values([insertFile])
      .returning();
    return file;
  }

  async getFilesByArchiveId(archiveId: string): Promise<File[]> {
    return await db.select().from(files).where(eq(files.archiveId, archiveId));
  }

  async getFile(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFileByPath(archiveId: string, path: string): Promise<File | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.archiveId, archiveId), eq(files.path, path)));
    return file || undefined;
  }

  async updateFile(id: string, updates: Partial<File>): Promise<File | undefined> {
    const [updatedFile] = await db
      .update(files)
      .set(updates)
      .where(eq(files.id, id))
      .returning();
    return updatedFile || undefined;
  }

  async deleteFilesByArchiveId(archiveId: string): Promise<void> {
    await db.delete(files).where(eq(files.archiveId, archiveId));
  }
}

export const storage = new DatabaseStorage();
