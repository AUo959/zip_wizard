import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles?: string[];
  };
}

const USER_ANCHOR_PATTERN = /^[A-Za-z0-9:_@.-]{1,128}$/;

function tokensMatch(providedToken: string | undefined, configuredToken: string): boolean {
  if (!providedToken) {
    return false;
  }

  const provided = Buffer.from(providedToken);
  const configured = Buffer.from(configuredToken);

  return provided.length === configured.length && crypto.timingSafeEqual(provided, configured);
}

/**
 * Simple token-based authentication for sensitive endpoints.
 * Uses Authorization: Bearer <token> and optional X-ZipWizard-User header
 * to anchor actions to a requestor for RBAC and audit logging.
 */
export function authenticateRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const configuredToken = process.env.API_AUTH_TOKEN;
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (!configuredToken) {
    const devBypassUserId = process.env.DEV_AUTH_BYPASS_USER_ID;
    if (process.env.NODE_ENV !== 'production' && devBypassUserId) {
      req.user = { id: devBypassUserId };
      next();
      return;
    }
    return res.status(503).json({ error: 'API authentication is not configured' });
  }

  if (!tokensMatch(bearerToken, configuredToken)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const claimedUser =
    typeof req.headers['x-zipwizard-user'] === 'string'
      ? req.headers['x-zipwizard-user']
      : 'T1_ANCHOR_SERVICE';
  if (!USER_ANCHOR_PATTERN.test(claimedUser)) {
    return res.status(400).json({ error: 'Invalid user anchor' });
  }

  req.user = {
    id: claimedUser,
  };

  next();
}
