import { useCallback, useState } from 'react';
import type { File } from '@shared/schema';

export function useWorkbenchState() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentFiles, setRecentFiles] = useState<File[]>([]);
  const [openTabs, setOpenTabs] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
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
