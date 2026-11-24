import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  user?: { id: string; roles?: string[] };
}

const USER_ID = /^[A-Za-z0-9:_@.-]{1,128}$/;

function credentialMap(configured: string): [string, string][] {
  const mapping: unknown = JSON.parse(configured);
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new Error('Invalid API credential mapping');
  }
  const entries = Object.entries(mapping);
  if (entries.length === 0) throw new Error('Empty API credential mapping');
  const tokens = new Set<string>();
  return entries.map(([id, value]) => {
    if (typeof value !== 'string' || !value || tokens.has(value)) {
      throw new Error('Each API identity requires a distinct token');
    }
    tokens.add(value);
    return [id, value];
  });
}

function credentials(): [string, string][] {
  const configured = process.env.API_AUTH_CREDENTIALS;
  const token = process.env.API_AUTH_TOKEN;
  if (configured) {
    if (token) throw new Error('Use one API credential configuration');
    return credentialMap(configured);
  }
  return token ? [[process.env.API_AUTH_USER_ID ?? 'T1_ANCHOR_SERVICE', token]] : [];
}

export function authenticatedUserId(req: AuthenticatedRequest): string {
  if (!req.user) throw new Error('Missing authenticated request context');
  return req.user.id;
}

function digest(value: string): Buffer {
  return crypto.createHash('sha256').update(value).digest();
}

function identityForToken(entries: [string, string][], authorization?: string): string | undefined {
  if (!authorization?.startsWith('Bearer ')) return undefined;
  const received = digest(authorization.slice(7));
  let identity;
  for (const [id, token] of entries) {
    if (crypto.timingSafeEqual(digest(token), received)) identity = id;
  }
  return identity;
}

function configuredUser(authorization?: string): string | undefined {
  const entries = credentials();
  if (entries.some(([id]) => !USER_ID.test(id))) throw new Error('Invalid API identity');
  if (entries.length > 0) return identityForToken(entries, authorization);

  const devUser = process.env.DEV_AUTH_BYPASS_USER_ID;
  if (process.env.NODE_ENV !== 'production' && devUser && USER_ID.test(devUser)) return devUser;
  throw new Error('API authentication is not configured');
}

export function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let id: string | undefined;
  try {
    id = configuredUser(req.headers.authorization);
  } catch {
    return res.status(503).json({ error: 'API authentication is not configured' });
  }
  if (!id) return res.status(401).json({ error: 'Unauthorized' });

  const administrators = process.env.API_AUTH_ADMIN_USERS?.split(',').map(value => value.trim());
  req.user = { id, roles: administrators?.includes(id) ? ['admin'] : [] };
  res.setHeader('Cache-Control', 'private, no-store');
  next();
}

export function requireAdministrator(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.roles?.includes('admin'))
    return res.status(403).json({ error: 'Administrator required' });
  next();
}
