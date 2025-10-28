import type { File, FileTreeNode } from '@shared/schema';

export function buildFileTree(files: File[]): FileTreeNode[] {
  const nodeMap = new Map<string, FileTreeNode>();
  const rootNodes: FileTreeNode[] = [];

  // Create nodes for all files and directories
  files.forEach(file => {
    const node: FileTreeNode = {
      id: file.id,
      name: file.name,
      path: file.path,
      isDirectory: file.isDirectory === 'true',
      size: file.size,
      extension: file.extension || undefined,
      language: file.language || undefined,
      tags: file.tags || undefined,
      children: file.isDirectory === 'true' ? [] : undefined,
    };
    nodeMap.set(file.path, node);
  });

  // Build the hierarchy
  files.forEach(file => {
    const node = nodeMap.get(file.path);
    if (!node) return;

    if (file.parentPath && file.parentPath !== '.') {
      const parentNode = nodeMap.get(file.parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  });

  // Sort nodes: directories first, then files, both alphabetically
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) sortNodes(node.children);
    });
  };

  sortNodes(rootNodes);
  return rootNodes;
}

export function searchFiles(files: File[], query: string): File[] {
  const lowerQuery = query.toLowerCase();
  return files.filter(
    file =>
      file.name.toLowerCase().includes(lowerQuery) ||
      file.path.toLowerCase().includes(lowerQuery) ||
      file.description?.toLowerCase().includes(lowerQuery) ||
      file.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

export function getFilesByLanguage(files: File[], language: string): File[] {
  return files.filter(file => file.language === language);
}

export function getFilesByTag(files: File[], tag: string): File[] {
  return files.filter(file => file.tags?.includes(tag));
}
