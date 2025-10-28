/**
 * Utility functions to convert between schema types and archive types
 */

import type { Archive as SchemaArchive, File as SchemaFile } from '@shared/schema';
import type { Archive, FileNode, ArchiveStatus } from '@shared/archive-types';

/**
 * Convert schema archive to advanced archive format
 */
export const convertSchemaArchive = (schemaArchive: SchemaArchive): Archive => {
  // Map status - schema might not have all statuses
  const status: ArchiveStatus = 'idle'; // Default status

  return {
    id: schemaArchive.id.toString(),
    name: schemaArchive.name,
    size: schemaArchive.originalSize || 0,
    status,
    createdAt: schemaArchive.uploadedAt || new Date(),
    modifiedAt: schemaArchive.uploadedAt,
    tags: [], // Schema doesn't have tags on archives
    format: schemaArchive.name.split('.').pop(),
    fileCount: schemaArchive.fileCount,
    // Additional fields would need to be computed or fetched
    healthScore: 100, // Default to healthy
  };
};

/**
 * Convert schema files to file tree
 */
export const convertSchemaFilesToTree = (files: SchemaFile[]): FileNode[] => {
  const tree: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  // Sort files by path to ensure parent folders are created first
  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];

    // Create folder structure
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!folderMap.has(folderPath)) {
        const folderNode: FileNode = {
          id: `folder-${folderPath}`,
          name: folderName,
          type: 'folder',
          path: folderPath,
          children: [],
        };
        folderMap.set(folderPath, folderNode);

        // Add to parent or root
        if (currentPath) {
          const parent = folderMap.get(currentPath);
          if (parent && parent.children) {
            parent.children.push(folderNode);
          }
        } else {
          tree.push(folderNode);
        }
      }

      currentPath = folderPath;
    }

    // Create file node
    const fileNode: FileNode = {
      id: file.id.toString(),
      name: fileName,
      type: 'file',
      path: file.path,
      size: file.size,
      extension: file.extension || fileName.split('.').pop(),
      metadata: {
        lastModified: file.lastMutated || undefined,
      },
    };

    // Add to parent or root
    const parentPath = parts.slice(0, -1).join('/');
    if (parentPath) {
      const parent = folderMap.get(parentPath);
      if (parent && parent.children) {
        parent.children.push(fileNode);
      }
    } else {
      tree.push(fileNode);
    }
  }

  return tree;
};
