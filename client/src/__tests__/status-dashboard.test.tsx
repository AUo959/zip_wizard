import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/queryClient';
import { StatusDashboard } from '../components/status-dashboard';

afterEach(() => {
  vi.restoreAllMocks();
});

it('loads archive status from the API and displays unknown legacy replayability', async () => {
  const client = new QueryClient({ defaultOptions: queryClient.getDefaultOptions() });
  const payload = {
    success: true,
    data: {
      symbolicChain: 'legacy-chain',
      threadTag: 'legacy',
      ethicsLock: 'Active',
      trustAnchor: 'Verified',
      deploymentStatus: {
        guiHabitat: true,
        glyphcardExport: true,
        zipBundle: 'legacy.zip',
        monitoring: 'Active',
        acknowledgment: true,
      },
      replayState: { replayable: null, continuityAnchors: 'Preserved' },
    },
  };
  const fetchStatus = vi.fn().mockResolvedValue(Response.json(payload));
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetchStatus);

  render(
    <QueryClientProvider client={client}>
      <StatusDashboard archiveId="legacy" />
    </QueryClientProvider>
  );

  expect(await screen.findByText('Unknown')).toBeInTheDocument();
  expect(fetchStatus).toHaveBeenCalledWith('/api/v1/archives/legacy/status', expect.anything());
});
