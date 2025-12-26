import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Archive as ArchiveType, File } from '@shared/schema';
import { convertSchemaArchive } from '@/lib/archive-converter';

export function useArchiveNavigation(showUpload: boolean) {
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
    queryKey: [`archives/${selectedArchive?.id}/files?redacted=true`],
    enabled: !!selectedArchive,
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
