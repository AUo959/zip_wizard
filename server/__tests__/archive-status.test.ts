import { once } from 'node:events';
import { type AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, expect, it, vi } from 'vitest';
import { observer } from '../observer';
import { storage } from '../storage';
import { registerRoutes } from '../routes';

vi.mock('../audit-log', () => ({
  auditLog: { log: vi.fn().mockResolvedValue(undefined), query: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../storage', () => ({
  storage: {
    getOwnedArchives: vi.fn().mockResolvedValue([]),
    getOwnedObserverEvents: vi.fn().mockResolvedValue([]),
    getRecentMutations: vi.fn().mockResolvedValue([]),
    getResourceOwner: vi
      .fn()
      .mockImplementation(async (id: string) => (id === 'status-fixture' ? 'status-owner' : null)),
    getArchive: vi.fn().mockResolvedValue({
      name: 'test.zip',
      replayable: null,
      symbolicChain: '',
      monitoringWindow: 0,
    }),
  },
}));

vi.mock('../observer', () => ({
  observer: {
    isWithinMonitoringWindow: vi.fn().mockResolvedValue(true),
    getActivitySummary: vi.fn().mockResolvedValue({ totalEvents: 0 }),
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

it('serves archive status only with authentication and archive read permission', async () => {
  vi.stubEnv('API_AUTH_TOKEN', undefined);
  const ownerToken = 'fixture-owner-token';
  const adminToken = 'fixture-admin-token';
  const archiveId = 'status-fixture';
  vi.stubEnv(
    'API_AUTH_CREDENTIALS',
    JSON.stringify({ 'status-owner': ownerToken, operator: adminToken })
  );
  vi.stubEnv('API_AUTH_ADMIN_USERS', 'operator');

  const server = await registerRoutes(express());
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/api/v1/archives/${archiveId}/status`;

    expect((await fetch(url)).status).toBe(401);
    expect((await fetch(url, { headers: { Authorization: `Bearer ${adminToken}` } })).status).toBe(
      403
    );

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        symbolicChain: 'N/A',
        replayState: { replayable: null },
        deploymentStatus: { zipBundle: 'test.zip' },
      },
    });
    expect(observer.getActivitySummary).toHaveBeenCalledWith(archiveId, 48);

    const base = `http://127.0.0.1:${port}/api/v1`;
    const ownerHeaders = { Authorization: `Bearer ${ownerToken}` };
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const session = await fetch(`${base}/auth/session`, { headers: ownerHeaders });
    expect(session.headers.get('cache-control')).toBe('private, no-store');
    await expect(session.json()).resolves.toMatchObject({
      data: { id: 'status-owner', roles: [] },
    });

    expect((await fetch(`${base}/archives`, { headers: ownerHeaders })).status).toBe(200);
    expect(storage.getOwnedArchives).toHaveBeenCalledWith('status-owner');
    const events = await fetch(`${base}/observer/events?archiveId=${archiveId}&type=upload`, {
      headers: ownerHeaders,
    });
    expect(events.status).toBe(200);
    expect(storage.getOwnedObserverEvents).toHaveBeenCalledWith(
      'status-owner',
      100,
      archiveId,
      'upload'
    );
    expect((await fetch(`${base}/mutations`, { headers: ownerHeaders })).status).toBe(200);
    expect(storage.getRecentMutations).toHaveBeenCalledWith('status-owner', 50);
    expect((await fetch(`${base}/security/audit-logs`, { headers: ownerHeaders })).status).toBe(
      403
    );
    expect((await fetch(`${base}/security/audit-logs`, { headers: adminHeaders })).status).toBe(
      200
    );
  } finally {
    server.close();
    await once(server, 'close');
  }
});
