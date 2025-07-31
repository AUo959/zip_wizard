// File utility functions for ZipWizard v2.2.6b

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function copyToClipboard(text: string, successMessage?: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => {
      return true;
    })
    .catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textarea);
      return result;
    });
}

export function getFileExtensionIcon(extension: string): string {
  const ext = extension?.toLowerCase();
  switch (ext) {
    case '.js':
    case '.jsx':
      return '🟨';
    case '.ts':
    case '.tsx':
      return '🟦';
    case '.py':
      return '🐍';
    case '.java':
      return '☕';
    case '.css':
      return '🎨';
    case '.html':
      return '🌐';
    case '.json':
      return '📋';
    case '.md':
      return '📝';
    case '.txt':
      return '📄';
    case '.yml':
    case '.yaml':
      return '⚙️';
    default:
      return '📄';
  }
}

export function buildBreadcrumbs(path: string): { name: string; path: string }[] {
  if (!path || path === '/') return [];
  
  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  for (let i = 0; i < parts.length; i++) {
    breadcrumbs.push({
      name: parts[i],
      path: '/' + parts.slice(0, i + 1).join('/')
    });
  }
  
  return breadcrumbs;
}

export function countFilesInDirectory(files: any[], dirPath: string): number {
  return files.filter(file => 
    file.parentPath === dirPath || 
    file.path.startsWith(dirPath + '/')
  ).length;
}