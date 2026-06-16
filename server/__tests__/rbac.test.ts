import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../audit-log', () => ({
  auditLog: {
    log: vi.fn().mockResolvedValue({}),
  },
}));

import { rbac, requirePermission } from '../rbac';

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe('requirePermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails closed instead of auto-assigning ownership for unknown resources', async () => {
    const middleware = requirePermission('read', 'archive');
    const req = {
      params: { id: 'missing-archive' },
      path: '/api/v1/archives/missing-archive',
      user: { id: 'requester-1' },
      headers: {},
      connection: {},
    };
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(rbac.getResourcePermissions('missing-archive')).toBeUndefined();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Resource authorization context not found',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('continues when an existing owner has the required permission', async () => {
    const resourceId = 'archive-with-owner';
    rbac.setResourcePermissions(resourceId, {
      resourceId,
      resourceType: 'archive',
      ownerId: 'owner-1',
      permissions: new Map([['owner-1', 'owner']]),
    });

    const middleware = requirePermission('read', 'archive');
    const req = {
      params: { id: resourceId },
      path: `/api/v1/archives/${resourceId}`,
      user: { id: 'owner-1' },
      headers: {},
      connection: {},
    };
    const res = createResponse();
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
