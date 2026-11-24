import {
  archives,
  files,
  observerEvents,
  fileMutations,
  type InsertArchive,
  type InsertFile,
  type ObserverEvent,
  type InsertObserverEvent,
  type FileMutation,
  type InsertFileMutation,
} from '@shared/schema';
import { normalizeTags, normalizeDependencies } from '@shared/validation';
import { db } from './db';
import { eq, and, desc, getTableColumns } from 'drizzle-orm';
import { auditLog } from './audit-log';

type StoredArchive = {
  id: string;
  name: string;
  originalSize: number;
  fileCount: number;
  uploadedAt: Date;
  symbolicChain: string | null;
  threadTag: string | null;
  ethicsLock: string | null;
  trustAnchor: string | null;
  replayable: boolean | null;
  monitoringWindow: number | null;
};

type StoredFile = {
  id: string;
  archiveId: string;
  path: string;
  name: string;
  extension: string | null;
  size: number;
  content: string | null;
  redactedPreview: string | null;
  isDirectory: string;
  parentPath: string | null;
  language: string | null;
  description: string | null;
  tags: string[] | null;
  complexity: string | null;
  dependencies: string[] | null;
  originalHash: string | null;
  currentHash: string | null;
  lastMutated: Date | null;
};

type StoredArchiveUpdate = Partial<StoredArchive>;
type StoredFileUpdate = Partial<StoredFile>;

/* eslint-disable no-unused-vars -- Interface method arguments define the storage contract. */
export interface IStorage {
  // Archive operations
  createArchive(archive: InsertArchive, ownerId: string): Promise<StoredArchive>;
  updateArchive(id: string, updates: StoredArchiveUpdate): Promise<StoredArchive | undefined>;
  getArchive(id: string): Promise<StoredArchive | undefined>;
  getOwnedArchives(ownerId: string): Promise<StoredArchive[]>;
  getResourceOwner(resourceId: string, resourceType: 'archive' | 'file'): Promise<string | null>;
  getOwnedObserverEvents(
    ownerId: string,
    limit: number,
    archiveId?: string,
    type?: string
  ): Promise<ObserverEvent[]>;
  deleteArchive(id: string): Promise<void>;

  // File operations
  createFile(file: InsertFile): Promise<StoredFile>;
  getFilesByArchiveId(archiveId: string): Promise<StoredFile[]>;
  getFile(id: string): Promise<StoredFile | undefined>;
  getFileByPath(archiveId: string, path: string): Promise<StoredFile | undefined>;
  updateFile(id: string, updates: StoredFileUpdate): Promise<StoredFile | undefined>;
  deleteFilesByArchiveId(archiveId: string): Promise<void>;

  // Observer event operations
  createObserverEvent(event: InsertObserverEvent): Promise<ObserverEvent>;
  getObserverEvents(archiveId?: string, limit?: number): Promise<ObserverEvent[]>;
  getObserverEventsByType(type: string, limit?: number): Promise<ObserverEvent[]>;
  deleteObserverEventsByArchiveId(archiveId: string): Promise<void>;

  // File mutation operations
  createFileMutation(mutation: InsertFileMutation): Promise<FileMutation>;
  getFileMutations(fileId: string): Promise<FileMutation[]>;
  getRecentMutations(ownerId: string, limit?: number): Promise<FileMutation[]>;
  deleteFileMutationsByFileId(fileId: string): Promise<void>;
}
/* eslint-enable no-unused-vars */

export class DatabaseStorage implements IStorage {
  async createArchive(insertArchive: InsertArchive, ownerId: string): Promise<StoredArchive> {
    const [archive] = await db
      .insert(archives)
      .values({ ...insertArchive, ownerId })
      .returning();
    return archive;
  }

  async updateArchive(
    id: string,
    updates: StoredArchiveUpdate
  ): Promise<StoredArchive | undefined> {
    const [archive] = await db.update(archives).set(updates).where(eq(archives.id, id)).returning();
    return archive ?? undefined;
  }

  async getArchive(id: string): Promise<StoredArchive | undefined> {
    const [archive] = await db.select().from(archives).where(eq(archives.id, id));
    return archive || undefined;
  }

  async getOwnedArchives(ownerId: string): Promise<StoredArchive[]> {
    return await db.select().from(archives).where(eq(archives.ownerId, ownerId));
  }

  async getResourceOwner(
    resourceId: string,
    resourceType: 'archive' | 'file'
  ): Promise<string | null> {
    const ownerField = { owner: archives.ownerId };
    const [record] =
      resourceType === 'archive'
        ? await db.select(ownerField).from(archives).where(eq(archives.id, resourceId)).limit(1)
        : await db
            .select(ownerField)
            .from(files)
            .innerJoin(archives, eq(files.archiveId, archives.id))
            .where(eq(files.id, resourceId))
            .limit(1);
    return record?.owner ?? null;
  }

  async getOwnedObserverEvents(
    ownerId: string,
    limit: number,
    archiveId?: string,
    type?: string
  ): Promise<ObserverEvent[]> {
    return await db
      .select(getTableColumns(observerEvents))
      .from(observerEvents)
      .innerJoin(archives, eq(observerEvents.archiveId, archives.id))
      .where(
        and(
          eq(archives.ownerId, ownerId),
          archiveId === undefined ? undefined : eq(observerEvents.archiveId, archiveId),
          type === undefined ? undefined : eq(observerEvents.type, type)
        )
      )
      .orderBy(desc(observerEvents.timestamp))
      .limit(limit);
  }

  async deleteArchive(id: string): Promise<void> {
    try {
      await db.transaction(async tx => {
        const archiveFiles = await tx.select().from(files).where(eq(files.archiveId, id));

        for (const file of archiveFiles) {
          await tx.delete(fileMutations).where(eq(fileMutations.fileId, file.id));
        }

        await tx.delete(observerEvents).where(eq(observerEvents.archiveId, id));
        await tx.delete(files).where(eq(files.archiveId, id));
        await tx.delete(archives).where(eq(archives.id, id));
      });
    } catch (error) {
      await auditLog.log('critical', 'modification', 'Archive deletion rolled back', {
        resource: 'archive',
        resourceId: id,
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
      throw error;
    }
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
  async createFile(insertFile: InsertFile): Promise<StoredFile> {
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

  async getFilesByArchiveId(archiveId: string): Promise<StoredFile[]> {
    return await db.select().from(files).where(eq(files.archiveId, archiveId));
  }

  async getFile(id: string): Promise<StoredFile | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFileByPath(archiveId: string, path: string): Promise<StoredFile | undefined> {
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.archiveId, archiveId), eq(files.path, path)));
    return file || undefined;
  }

  async updateFile(id: string, updates: StoredFileUpdate): Promise<StoredFile | undefined> {
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

  async getRecentMutations(ownerId: string, limit: number = 50): Promise<FileMutation[]> {
    return await db
      .select(getTableColumns(fileMutations))
      .from(fileMutations)
      .innerJoin(files, eq(fileMutations.fileId, files.id))
      .innerJoin(archives, eq(files.archiveId, archives.id))
      .where(eq(archives.ownerId, ownerId))
      .orderBy(desc(fileMutations.timestamp))
      .limit(limit);
  }

  async deleteFileMutationsByFileId(fileId: string): Promise<void> {
    await db.delete(fileMutations).where(eq(fileMutations.fileId, fileId));
  }
}

export const storage = new DatabaseStorage();
