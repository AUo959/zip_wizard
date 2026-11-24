import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateRequest, type AuthenticatedRequest } from '../middleware/auth';

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
  };
}

const originalEnv = { ...process.env };

describe('authenticateRequest', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.API_AUTH_TOKEN;
    delete process.env.API_AUTH_CREDENTIALS;
    delete process.env.API_AUTH_ADMIN_USERS;
    delete process.env.API_AUTH_USER_ID;
    delete process.env.DEV_AUTH_BYPASS_USER_ID;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('fails closed when auth is not configured without an explicit dev bypass user', () => {
    const req = { headers: {} } as AuthenticatedRequest;
    const res = createResponse();
    const next = vi.fn();

    authenticateRequest(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'API authentication is not configured' });
    expect(next).not.toHaveBeenCalled();
  });

  it('uses the explicit dev bypass user outside production', () => {
    process.env.DEV_AUTH_BYPASS_USER_ID = 'dev-user-1';
    const req = { headers: {} } as AuthenticatedRequest;
    const res = createResponse();
    const next = vi.fn();

    authenticateRequest(req, res as any, next);

    expect(req.user).toEqual({ id: 'dev-user-1', roles: [] });
    expect(next).toHaveBeenCalledOnce();
  });

  it('uses the server identity for the valid bearer token', () => {
    process.env.API_AUTH_TOKEN = 'token-123';
    process.env.API_AUTH_USER_ID = 'configured-user';
    const req = {
      headers: {
        authorization: 'Bearer token-123',
        'x-zipwizard-user': 'owner-1',
      },
    } as unknown as AuthenticatedRequest;
    const res = createResponse();
    const next = vi.fn();

    authenticateRequest(req, res as any, next);

    expect(req.user).toEqual({ id: 'configured-user', roles: [] });
    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects an invalid bearer token', () => {
    process.env.API_AUTH_TOKEN = 'token-123';
    const req = {
      headers: {
        authorization: 'Bearer token-abc',
      },
    } as unknown as AuthenticatedRequest;
    const res = createResponse();
    const next = vi.fn();

    authenticateRequest(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects duplicate tokens in a credential map', () => {
    process.env.API_AUTH_CREDENTIALS = JSON.stringify({ member: 'shared', admin: 'shared' });
    const req = { headers: { authorization: 'Bearer shared' } } as AuthenticatedRequest;
    const res = createResponse();
    const next = vi.fn();

    authenticateRequest(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(next).not.toHaveBeenCalled();
  });
});
