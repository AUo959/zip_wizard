import { sql } from 'drizzle-orm';
import {
  pgTable,
  text,
  varchar,
  jsonb,
  integer,
  timestamp,
  boolean,
  json,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const archives = pgTable('archives', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  originalSize: integer('original_size').notNull(),
  fileCount: integer('file_count').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  // Enhanced metadata for ZIPWizard v2.2.6b
  symbolicChain: text('symbolic_chain'),
  threadTag: text('thread_tag'),
  ethicsLock: text('ethics_lock'),
  trustAnchor: text('trust_anchor'),
  replayable: boolean('replayable').default(true),
  monitoringWindow: integer('monitoring_window').default(48), // hours
});

export const files = pgTable('files', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  archiveId: varchar('archive_id')
    .notNull()
    .references(() => archives.id),
  path: text('path').notNull(),
  name: text('name').notNull(),
  extension: text('extension'),
  size: integer('size').notNull(),
  content: text('content'),
  isDirectory: text('is_directory').notNull().default('false'),
  parentPath: text('parent_path'),
  language: text('language'),
  description: text('description'),
  tags: jsonb('tags').$type<string[]>().default([]),
  complexity: text('complexity'),
  dependencies: jsonb('dependencies').$type<string[]>().default([]),
  // Mutation tracking
  originalHash: text('original_hash'),
  currentHash: text('current_hash'),
  lastMutated: timestamp('last_mutated'),
});

// Observer events table
export const observerEvents = pgTable('observer_events', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  archiveId: varchar('archive_id').references(() => archives.id),
  fileId: varchar('file_id').references(() => files.id),
  type: text('type').notNull(), // 'upload' | 'analysis' | 'mutation' | 'export' | 'access'
  target: text('target').notNull(),
  metadata: json('metadata'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  severity: text('severity').notNull(), // 'info' | 'warning' | 'critical'
});

// File mutations table
export const fileMutations = pgTable('file_mutations', {
  id: varchar('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  fileId: varchar('file_id')
    .notNull()
    .references(() => files.id),
  type: text('type').notNull(), // 'content' | 'metadata' | 'structure'
  description: text('description').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  author: text('author'),
  delta: json('delta'),
});

// Audit logs table - immutable, append-only
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  level: text("level").notNull(), // 'info' | 'warning' | 'critical'
  category: text("category").notNull(), // 'access' | 'modification' | 'security' | 'privacy' | etc.
  action: text("action").notNull(),
  userId: varchar("user_id"),
  sessionId: varchar("session_id"),
  ipAddress: text("ip_address"),
  resource: text("resource"),
  resourceId: varchar("resource_id"),
  details: json("details"),
  signature: text("signature").notNull(), // HMAC-SHA256 signature for tamper-proof logging
});

export const insertArchiveSchema = createInsertSchema(archives).omit({
  id: true,
  uploadedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
});

export const insertObserverEventSchema = createInsertSchema(observerEvents).omit({
  id: true,
  timestamp: true,
});

export const insertFileMutationSchema = createInsertSchema(fileMutations).omit({
  id: true,
  timestamp: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs);

export type InsertArchive = z.infer<typeof insertArchiveSchema>;
export type Archive = typeof archives.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type ObserverEvent = typeof observerEvents.$inferSelect;
export type InsertObserverEvent = z.infer<typeof insertObserverEventSchema>;
export type FileMutation = typeof fileMutations.$inferSelect;
export type InsertFileMutation = z.infer<typeof insertFileMutationSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Client-side types for file tree
export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  extension?: string;
  language?: string;
  tags?: string[];
  children?: FileTreeNode[];
}

export interface AnalysisResult {
  totalFiles: number;
  components: number;
  modules: number;
  utilities: number;
  languages: Record<string, number>;
}
