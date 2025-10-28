import { storage } from './storage';
import { type InsertObserverEvent } from '@shared/schema';
import { nanoid } from 'nanoid';

export class ObserverService {
  private static instance: ObserverService;

  private constructor() {}

  static getInstance(): ObserverService {
    if (!ObserverService.instance) {
      ObserverService.instance = new ObserverService();
    }
    return ObserverService.instance;
  }

  async trackEvent(
    type: 'upload' | 'analysis' | 'mutation' | 'export' | 'access',
    target: string,
    metadata: Record<string, any> = {},
    archiveId?: string,
    fileId?: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ) {
    const event: InsertObserverEvent = {
      type,
      target,
      metadata,
      archiveId: archiveId || null,
      fileId: fileId || null,
      severity,
    };

    try {
      await storage.createObserverEvent(event);
      console.log(`[Observer] Event tracked: ${type} on ${target}`);
    } catch (error) {
      console.error('[Observer] Failed to track event:', error);
    }
  }

  async trackUpload(archiveId: string, archiveName: string, fileCount: number) {
    await this.trackEvent(
      'upload',
      archiveName,
      {
        fileCount,
        timestamp: new Date().toISOString(),
      },
      archiveId
    );
  }

  async trackAnalysis(archiveId: string, fileId: string, fileName: string, analysisResults: any) {
    await this.trackEvent(
      'analysis',
      fileName,
      {
        language: analysisResults.language,
        complexity: analysisResults.complexity,
        tags: analysisResults.tags,
        dependencies: analysisResults.dependencies,
      },
      archiveId,
      fileId
    );
  }

  async trackMutation(fileId: string, fileName: string, mutationType: string, description: string) {
    await this.trackEvent(
      'mutation',
      fileName,
      {
        mutationType,
        description,
      },
      undefined,
      fileId,
      'warning'
    );
  }

  async trackExport(archiveId: string, archiveName: string, exportFormat: string) {
    await this.trackEvent(
      'export',
      archiveName,
      {
        format: exportFormat,
        timestamp: new Date().toISOString(),
      },
      archiveId
    );
  }

  async trackAccess(target: string, accessType: string, userId?: string) {
    await this.trackEvent('access', target, {
      accessType,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
    });
  }

  async getActivitySummary(archiveId?: string, hoursBack: number = 48) {
    const events = await storage.getObserverEvents(archiveId, 1000);
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const recentEvents = events.filter(e => new Date(e.timestamp) > cutoffTime);

    const summary = {
      totalEvents: recentEvents.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      recentCritical: recentEvents.filter(e => e.severity === 'critical'),
    };

    recentEvents.forEach(event => {
      summary.byType[event.type] = (summary.byType[event.type] || 0) + 1;
      summary.bySeverity[event.severity] = (summary.bySeverity[event.severity] || 0) + 1;
    });

    return summary;
  }

  // Check if archive is within monitoring window
  async isWithinMonitoringWindow(archiveId: string): Promise<boolean> {
    const archive = await storage.getArchive(archiveId);
    if (!archive || !archive.monitoringWindow) return false;

    const uploadTime = new Date(archive.uploadedAt).getTime();
    const currentTime = Date.now();
    const windowMs = archive.monitoringWindow * 60 * 60 * 1000; // Convert hours to ms

    return currentTime - uploadTime < windowMs;
  }
}

export const observer = ObserverService.getInstance();
