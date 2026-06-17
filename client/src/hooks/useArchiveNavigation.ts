import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Archive as ArchiveType, File } from '@shared/schema';
import { convertSchemaArchive } from '@/lib/archive-converter';
import { apiRequest } from '@/lib/queryClient';

export function useArchiveNavigation(showUpload: boolean) {
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  const [selectedArchive, setSelectedArchive] = useState<ArchiveType | null>(null);

  const { data: archives = [], refetch: refetchArchives } = useQuery<ArchiveType[]>({
    queryKey: ['archives'],
    enabled: !showUpload,
  });

  useEffect(() => {
    if (archives.length > 0 && !selectedArchive) {
      setSelectedArchive(archives[0]);
    }
  }, [archives, selectedArchive]);

  const { data: files = [] } = useQuery<File[]>({
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
