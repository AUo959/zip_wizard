import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { convertSchemaArchive } from '@/lib/archive-converter';
import { apiRequest } from '@/lib/queryClient';

type ArchiveRecord = {
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

export function useArchiveNavigation(showUpload: boolean) {
  const [selectedArchive, setSelectedArchive] = useState<ArchiveRecord | null>(null);

  const { data: archives = [], refetch: refetchArchives } = useQuery<ArchiveRecord[]>({
    queryKey: ['archives'],
    enabled: !showUpload,
  });

  useEffect(() => {
    if (archives.length > 0 && !selectedArchive) {
      setSelectedArchive(archives[0]);
    }
  }, [archives, selectedArchive]);

  const { data: files = [] } = useQuery<FileRecord[]>({
    queryKey: ['archive-files', selectedArchive?.id, { redacted: true }],
    enabled: !!selectedArchive,
    queryFn: async () => {
      if (!selectedArchive) return [];

      const response = await apiRequest('GET', `archives/${selectedArchive.id}/files`);
      const payload = await response.json();
      return payload?.data ?? [];
    },
  });

  const convertedArchive = selectedArchive ? convertSchemaArchive(selectedArchive) : undefined;

  return {
    archives,
    files,
    selectedArchive,
    setSelectedArchive,
    convertedArchive,
    refetchArchives,
  };
}
