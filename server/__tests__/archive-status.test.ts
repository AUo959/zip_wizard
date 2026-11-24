import { once } from 'node:events';
import { type AddressInfo } from 'node:net';
import express from 'express';
import { afterEach, expect, it, vi } from 'vitest';
import { rbac } from '../rbac';
import { registerRoutes } from '../routes';

vi.mock('../audit-log', () => ({
  auditLog: { log: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../storage', () => ({
  storage: {
    getArchive: vi.fn().mockResolvedValue({
      name: 'test.zip',
      replayable: null,
      monitoringWindow: 48,
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
  vi.stubEnv('API_AUTH_TOKEN', 'fixture-token');
  vi.stubEnv('CORS_ALLOW_NO_ORIGIN', 'true');
  const archiveId = 'status-fixture';
  rbac.setResourcePermissions(archiveId, {
    resourceId: archiveId,
    resourceType: 'archive',
    ownerId: 'status-owner',
    permissions: new Map(),
  });

  const server = await registerRoutes(express());
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/api/v1/archives/${archiveId}/status`;

    expect((await fetch(url)).status).toBe(401);
    expect((await fetch(url, { headers: { Authorization: 'Bearer fixture-token' } })).status).toBe(
      403
    );

    const response = await fetch(url, {
      headers: { Authorization: 'Bearer fixture-token', 'X-ZipWizard-User': 'status-owner' },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { replayState: { replayable: null }, deploymentStatus: { zipBundle: 'test.zip' } },
    });
  } finally {
    server.close();
    await once(server, 'close');
  }
});
