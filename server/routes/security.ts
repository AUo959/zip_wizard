/**
 * Security and Audit API Routes
 * 
 * Provides endpoints for:
 * - Audit log querying and export
 * - Notification management
 * - RBAC permission checks
 * - Security event reporting
 */

import express, { Request } from 'express';
import { auditLog } from '../audit-log';
import { rbac } from '../rbac';
import { notificationService } from '../notifications';

const router = express.Router();

// Extend Express Request type to include user and sessionID
interface AuthRequest extends Request {
  user?: { id: string };
  sessionID?: string;
}

/**
 * GET /api/v1/security/audit-logs
 * Query audit logs with filters
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      level: req.query.level as any,
      category: req.query.category as any,
      userId: req.query.userId as string,
      resourceId: req.query.resourceId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const logs = await auditLog.query(filters);
    
    res.json({
      logs,
      count: logs.length,
      filters
    });
  } catch (error) {
    console.error('Error querying audit logs:', error);
    res.status(500).json({ 
      error: 'Failed to query audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/security/audit-logs/export
 * Export audit logs in JSON or CSV format
 */
router.get('/audit-logs/export', async (req, res) => {
  try {
    const format = (req.query.format as string) || 'json';
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      level: req.query.level as any,
      category: req.query.category as any,
      userId: req.query.userId as string,
      resourceId: req.query.resourceId as string,
      limit: 10000
    };

    if (format === 'csv') {
      const csv = await auditLog.exportCSV(filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      const json = await auditLog.exportJSON(filters);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(json);
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ 
      error: 'Failed to export audit logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/security/audit-logs/statistics
 * Get audit log statistics
 */
router.get('/audit-logs/statistics', async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
    };

    const stats = await auditLog.getStatistics(filters);
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting audit log statistics:', error);
    res.status(500).json({ 
      error: 'Failed to get statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/security/notifications
 * Get all notifications for current user
 */
router.get('/notifications', async (req, res) => {
  try {
    const unacknowledgedOnly = req.query.unacknowledged === 'true';
    
    const notifications = unacknowledgedOnly 
      ? notificationService.getUnacknowledged()
      : notificationService.getAll();
    
    res.json({
      notifications,
      statistics: notificationService.getStatistics()
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ 
      error: 'Failed to get notifications',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/security/notifications/:id/acknowledge
 * Acknowledge a notification
 */
router.post('/notifications/:id/acknowledge', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    await notificationService.acknowledge(id, userId);
    
    res.json({ success: true, message: 'Notification acknowledged' });
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    res.status(500).json({ 
      error: 'Failed to acknowledge notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/security/notifications/:id/snooze
 * Snooze a notification
 */
router.post('/notifications/:id/snooze', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { durationMinutes } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!durationMinutes || typeof durationMinutes !== 'number') {
      return res.status(400).json({ error: 'Invalid duration' });
    }

    await notificationService.snooze(id, durationMinutes, userId);
    
    res.json({ 
      success: true, 
      message: 'Notification snoozed',
      snoozedUntil: new Date(Date.now() + durationMinutes * 60 * 1000)
    });
  } catch (error) {
    console.error('Error snoozing notification:', error);
    res.status(500).json({ 
      error: 'Failed to snooze notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/security/check-permission
 * Check if user has permission for a resource
 */
router.post('/check-permission', async (req: AuthRequest, res) => {
  try {
    const { resourceId, resourceType, permission } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!resourceId || !resourceType || !permission) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const context = {
      userId,
      sessionId: req.sessionID,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    const result = await rbac.canAccess(
      resourceId,
      resourceType,
      userId,
      permission,
      context
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error checking permission:', error);
    res.status(500).json({ 
      error: 'Failed to check permission',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/security/report-event
 * Report a security event
 */
router.post('/report-event', async (req: AuthRequest, res) => {
  try {
    const { level, category, action, details } = req.body;
    const userId = req.user?.id || 'anonymous';

    if (!level || !category || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const logEntry = await auditLog.log(level, category, action, {
      userId,
      sessionId: req.sessionID,
      ipAddress: req.ip || req.connection.remoteAddress,
      details
    });
    
    res.json({ 
      success: true, 
      message: 'Security event logged',
      logId: logEntry.id
    });
  } catch (error) {
    console.error('Error reporting security event:', error);
    res.status(500).json({ 
      error: 'Failed to report security event',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/security/permissions/:resourceId
 * Get permission details for a resource
 */
router.get('/permissions/:resourceId', async (req: AuthRequest, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user?.id || 'anonymous';

    const permissions = rbac.getResourcePermissions(resourceId);
    const userRole = rbac.getUserRole(resourceId, userId);
    
    res.json({
      resourceId,
      userRole,
      permissions: permissions ? {
        resourceType: permissions.resourceType,
        ownerId: permissions.ownerId,
        publicRole: permissions.publicRole
      } : null
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    res.status(500).json({ 
      error: 'Failed to get permissions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
