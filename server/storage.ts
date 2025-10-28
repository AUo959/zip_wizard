import {
  archives,
  files,
  observerEvents,
  fileMutations,
  type Archive,
  type InsertArchive,
  type File,
  type InsertFile,
  type ObserverEvent,
  type InsertObserverEvent,
  type FileMutation,
  type InsertFileMutation,
} from '@shared/schema';
import { normalizeTags, normalizeDependencies } from '@shared/validation';
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';

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

  // Observer event operations
  createObserverEvent(event: InsertObserverEvent): Promise<ObserverEvent>;
  getObserverEvents(archiveId?: string, limit?: number): Promise<ObserverEvent[]>;
  getObserverEventsByType(type: string, limit?: number): Promise<ObserverEvent[]>;
  deleteObserverEventsByArchiveId(archiveId: string): Promise<void>;

  // File mutation operations
  createFileMutation(mutation: InsertFileMutation): Promise<FileMutation>;
  getFileMutations(fileId: string): Promise<FileMutation[]>;
  getRecentMutations(limit?: number): Promise<FileMutation[]>;
  deleteFileMutationsByFileId(fileId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createArchive(insertArchive: InsertArchive): Promise<Archive> {
    const [archive] = await db.insert(archives).values([insertArchive]).returning();
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
    // First, get all files for this archive to delete their mutations
    const archiveFiles = await this.getFilesByArchiveId(id);

    // Delete file mutations for all files in this archive
    for (const file of archiveFiles) {
      await this.deleteFileMutationsByFileId(file.id);
    }

    // Delete observer events for this archive
    await this.deleteObserverEventsByArchiveId(id);

    // Delete associated files
    await this.deleteFilesByArchiveId(id);

    // Finally delete the archive
    await db.delete(archives).where(eq(archives.id, id));
  }

  /**
   * Creates a new file record in the database.
   * Validates and normalizes array fields before insertion.
   *
   * @param insertFile - File data to insert
   * @returns The created file record
   * @see normalizeTags - For tags array validation
   * @see normalizeDependencies - For dependencies array validation
   */
  async createFile(insertFile: InsertFile): Promise<File> {
    // Ensure tags and dependencies are properly typed as string arrays
    const fileToInsert = {
      ...insertFile,
      tags: normalizeTags(insertFile.tags),
      dependencies: normalizeDependencies(insertFile.dependencies),
    };

    const [file] = await db
      .insert(files)
      .values(fileToInsert as any) // Type assertion for Drizzle compatibility
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
    const [updatedFile] = await db.update(files).set(updates).where(eq(files.id, id)).returning();
    return updatedFile || undefined;
  }

  async deleteFilesByArchiveId(archiveId: string): Promise<void> {
    await db.delete(files).where(eq(files.archiveId, archiveId));
  }

  // Observer event operations
  async createObserverEvent(event: InsertObserverEvent): Promise<ObserverEvent> {
    const [observerEvent] = await db.insert(observerEvents).values([event]).returning();
    return observerEvent;
  }

  async getObserverEvents(archiveId?: string, limit: number = 100): Promise<ObserverEvent[]> {
    if (archiveId) {
      return await db
        .select()
        .from(observerEvents)
        .where(eq(observerEvents.archiveId, archiveId))
        .orderBy(desc(observerEvents.timestamp))
        .limit(limit);
    }

    return await db
      .select()
      .from(observerEvents)
      .orderBy(desc(observerEvents.timestamp))
      .limit(limit);
  }

  async getObserverEventsByType(type: string, limit: number = 100): Promise<ObserverEvent[]> {
    return await db
      .select()
      .from(observerEvents)
      .where(eq(observerEvents.type, type))
      .orderBy(desc(observerEvents.timestamp))
      .limit(limit);
  }

  async deleteObserverEventsByArchiveId(archiveId: string): Promise<void> {
    await db.delete(observerEvents).where(eq(observerEvents.archiveId, archiveId));
  }

  // File mutation operations
  async createFileMutation(mutation: InsertFileMutation): Promise<FileMutation> {
    const [fileMutation] = await db.insert(fileMutations).values([mutation]).returning();
    return fileMutation;
  }

  async getFileMutations(fileId: string): Promise<FileMutation[]> {
    return await db
      .select()
      .from(fileMutations)
      .where(eq(fileMutations.fileId, fileId))
      .orderBy(desc(fileMutations.timestamp));
  }

  async getRecentMutations(limit: number = 50): Promise<FileMutation[]> {
    return await db
      .select()
      .from(fileMutations)
      .orderBy(desc(fileMutations.timestamp))
      .limit(limit);
  }

  async deleteFileMutationsByFileId(fileId: string): Promise<void> {
    await db.delete(fileMutations).where(eq(fileMutations.fileId, fileId));
  }
}

export const storage = new DatabaseStorage();
