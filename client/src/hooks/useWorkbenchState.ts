import { useCallback, useState } from 'react';

type FileRecord = {
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

export function useWorkbenchState() {
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [openTabs, setOpenTabs] = useState<FileRecord[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: FileRecord) => {
    setSelectedFile(file);
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.id !== file.id);
      return [file, ...filtered].slice(0, 10);
    });

    setOpenTabs(prev => {
      if (prev.find(tab => tab.id === file.id)) return prev;
      return [...prev, file];
    });
    setActiveTab(file.id);
  }, []);

  const handleTabClose = useCallback(
    (fileId: string) => {
      setOpenTabs(prev => {
        const remainingTabs = prev.filter(tab => tab.id !== fileId);

        if (activeTab === fileId) {
          setActiveTab(remainingTabs.length > 0 ? remainingTabs[0].id : null);
          setSelectedFile(remainingTabs.length > 0 ? remainingTabs[0] : null);
        }

        return remainingTabs;
      });
    },
    [activeTab]
  );

  return {
    selectedFile,
    recentFiles,
    openTabs,
    activeTab,
    setActiveTab,
    setSelectedFile,
    handleFileSelect,
    handleTabClose,
  };
}
