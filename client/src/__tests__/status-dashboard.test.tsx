import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { StatusDashboard } from '../components/status-dashboard';

it('displays unknown replayability for a legacy archive', () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  client.setQueryData(['/api/v1/archives/legacy/status'], {
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
  });

  render(
    <QueryClientProvider client={client}>
      <StatusDashboard archiveId="legacy" />
    </QueryClientProvider>
  );

  expect(screen.getByText('Unknown')).toBeInTheDocument();
});
