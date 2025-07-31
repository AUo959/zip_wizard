import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const archives = pgTable("archives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalSize: integer("original_size").notNull(),
  fileCount: integer("file_count").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  archiveId: varchar("archive_id").notNull().references(() => archives.id),
  path: text("path").notNull(),
  name: text("name").notNull(),
  extension: text("extension"),
  size: integer("size").notNull(),
  content: text("content"),
  isDirectory: text("is_directory").notNull().default("false"),
  parentPath: text("parent_path"),
  language: text("language"),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  complexity: text("complexity"),
  dependencies: jsonb("dependencies").$type<string[]>().default([]),
});

export const insertArchiveSchema = createInsertSchema(archives).omit({
  id: true,
  uploadedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
});

export type InsertArchive = z.infer<typeof insertArchiveSchema>;
export type Archive = typeof archives.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

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
