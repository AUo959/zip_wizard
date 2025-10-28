/**
 * Role-Based Access Control (RBAC) System
 *
 * Implements granular access control for files and archives.
 * Supports roles: Reader, Editor, Owner
 * Logs all access attempts and denials.
 */

import { auditLog } from './audit-log';

export type Role = 'reader' | 'editor' | 'owner' | 'admin';
export type Permission =
  | 'read'
  | 'write'
  | 'delete'
  | 'share'
  | 'export'
  | 'modify_permissions'
  | 'view_audit_logs';

export interface AccessContext {
  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ResourcePermissions {
  resourceId: string;
  resourceType: 'file' | 'archive';
  ownerId: string;
  permissions: Map<string, Role>; // userId -> Role
  publicRole?: Role; // Role for unauthenticated users
}

/**
 * Role hierarchy and permissions mapping
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  reader: ['read', 'export'],
  editor: ['read', 'write', 'export', 'share'],
  owner: ['read', 'write', 'delete', 'export', 'share', 'modify_permissions', 'view_audit_logs'],
  admin: ['read', 'write', 'delete', 'export', 'share', 'modify_permissions', 'view_audit_logs'],
};

class RBACService {
  private resourcePermissions: Map<string, ResourcePermissions> = new Map();

  /**
   * Set permissions for a resource
   */
  setResourcePermissions(resourceId: string, permissions: ResourcePermissions): void {
    this.resourcePermissions.set(resourceId, permissions);
  }

  /**
   * Get permissions for a resource
   */
  getResourcePermissions(resourceId: string): ResourcePermissions | undefined {
    return this.resourcePermissions.get(resourceId);
  }

  /**
   * Get user's role for a resource
   */
  getUserRole(resourceId: string, userId: string): Role | null {
    const permissions = this.resourcePermissions.get(resourceId);
    if (!permissions) return null;

    // Owner always has full access
    if (permissions.ownerId === userId) return 'owner';

    // Check explicit permissions
    return permissions.permissions.get(userId) || permissions.publicRole || null;
  }

  /**
   * Check if a role has a specific permission
   */
  roleHasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) || false;
  }

  /**
   * Check if a user can perform an action on a resource
   */
  async canAccess(
    resourceId: string,
    resourceType: 'file' | 'archive',
    userId: string,
    permission: Permission,
    context: AccessContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    const role = this.getUserRole(resourceId, userId);

    // Log access attempt
    await auditLog.log(
      role ? 'info' : 'warning',
      'authorization',
      `Access attempt: ${permission} on ${resourceType}`,
      {
        userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        resource: resourceType,
        resourceId,
        details: {
          permission,
          role: role || 'none',
          userAgent: context.userAgent,
        },
      }
    );

    if (!role) {
      await auditLog.log('warning', 'authorization', 'Access denied: No role assigned', {
        userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        resource: resourceType,
        resourceId,
        details: { permission },
      });

      return {
        allowed: false,
        reason: 'No role assigned for this resource',
      };
    }

    const hasPermission = this.roleHasPermission(role, permission);

    if (!hasPermission) {
      await auditLog.log('warning', 'authorization', 'Access denied: Insufficient permissions', {
        userId,
        sessionId: context.sessionId,
        ipAddress: context.ipAddress,
        resource: resourceType,
        resourceId,
        details: { permission, role },
      });

      return {
        allowed: false,
        reason: `Role '${role}' does not have permission '${permission}'`,
      };
    }

    return { allowed: true };
  }

  /**
   * Require access - throws error if not allowed
   */
  async requireAccess(
    resourceId: string,
    resourceType: 'file' | 'archive',
    userId: string,
    permission: Permission,
    context: AccessContext
  ): Promise<void> {
    const result = await this.canAccess(resourceId, resourceType, userId, permission, context);

    if (!result.allowed) {
      throw new Error(`Access denied: ${result.reason}`);
    }
  }

  /**
   * Grant role to a user for a resource
   */
  async grantRole(
    resourceId: string,
    targetUserId: string,
    role: Role,
    grantedBy: AccessContext
  ): Promise<void> {
    const permissions = this.resourcePermissions.get(resourceId);
    if (!permissions) {
      throw new Error('Resource not found');
    }

    // Check if granter has permission to modify permissions
    const canModify = await this.canAccess(
      resourceId,
      permissions.resourceType,
      grantedBy.userId,
      'modify_permissions',
      grantedBy
    );

    if (!canModify.allowed) {
      throw new Error(canModify.reason);
    }

    // Grant the role
    permissions.permissions.set(targetUserId, role);

    // Log the permission change
    await auditLog.log('info', 'authorization', 'Role granted', {
      userId: grantedBy.userId,
      sessionId: grantedBy.sessionId,
      ipAddress: grantedBy.ipAddress,
      resource: permissions.resourceType,
      resourceId,
      details: {
        targetUserId,
        role,
      },
    });
  }

  /**
   * Revoke role from a user for a resource
   */
  async revokeRole(
    resourceId: string,
    targetUserId: string,
    revokedBy: AccessContext
  ): Promise<void> {
    const permissions = this.resourcePermissions.get(resourceId);
    if (!permissions) {
      throw new Error('Resource not found');
    }

    // Check if revoker has permission to modify permissions
    const canModify = await this.canAccess(
      resourceId,
      permissions.resourceType,
      revokedBy.userId,
      'modify_permissions',
      revokedBy
    );

    if (!canModify.allowed) {
      throw new Error(canModify.reason);
    }

    // Cannot revoke owner's permissions
    if (permissions.ownerId === targetUserId) {
      throw new Error('Cannot revoke owner permissions');
    }

    // Revoke the role
    const previousRole = permissions.permissions.get(targetUserId);
    permissions.permissions.delete(targetUserId);

    // Log the permission change
    await auditLog.log('info', 'authorization', 'Role revoked', {
      userId: revokedBy.userId,
      sessionId: revokedBy.sessionId,
      ipAddress: revokedBy.ipAddress,
      resource: permissions.resourceType,
      resourceId,
      details: {
        targetUserId,
        previousRole,
      },
    });
  }

  /**
   * Create masked/redacted preview for restricted access
   */
  createMaskedPreview(content: string, maxLength: number = 500): string {
    if (content.length <= maxLength) {
      return content;
    }

    const preview = content.substring(0, maxLength);
    const redactedLines = content.split('\n').length - preview.split('\n').length;

    return `${preview}\n\n[... ${redactedLines} more lines redacted. Full access requires appropriate permissions ...]`;
  }

  /**
   * Log file operation with RBAC context
   */
  async logFileOperation(
    operation: 'view' | 'export' | 'share' | 'modify' | 'delete',
    resourceId: string,
    resourceType: 'file' | 'archive',
    context: AccessContext,
    metadata?: Record<string, any>
  ): Promise<void> {
    const level = operation === 'delete' ? 'warning' : 'info';

    await auditLog.log(level, 'access', `File ${operation}`, {
      userId: context.userId,
      sessionId: context.sessionId,
      ipAddress: context.ipAddress,
      resource: resourceType,
      resourceId,
      details: {
        operation,
        ...metadata,
      },
    });
  }
}

// Singleton instance
export const rbac = new RBACService();

/**
 * Middleware to check RBAC permissions
 */
export function requirePermission(permission: Permission) {
  return async (req: any, res: any, next: any) => {
    const resourceId = req.params.id || req.params.archiveId || req.params.fileId;
    const resourceType = req.path.includes('/files/') ? 'file' : 'archive';
    const userId = req.user?.id || 'anonymous';

    const context: AccessContext = {
      userId,
      sessionId: req.sessionID,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    try {
      await rbac.requireAccess(resourceId, resourceType, userId, permission, context);
      next();
    } catch (error) {
      res.status(403).json({
        error: 'Access denied',
        message: error instanceof Error ? error.message : 'Insufficient permissions',
      });
    }
  };
}
