import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles?: string[];
  };
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
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'DEV_ANCHOR' };
      return next();
    }
    return res.status(503).json({ error: 'API authentication is not configured' });
  }

  if (!bearerToken || bearerToken !== configuredToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const claimedUser = (req.headers['x-zipwizard-user'] as string) || 'T1_ANCHOR_SERVICE';
  req.user = {
    id: claimedUser,
  };

  next();
}
