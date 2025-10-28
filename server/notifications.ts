/**
 * Multi-Channel Notification System
 * 
 * Provides notification capabilities for security events, circuit breaker trips,
 * and other critical system events. Supports multiple channels:
 * - In-app notifications
 * - Email notifications
 * - Webhook/Slack notifications
 * - Browser notifications
 */

import { auditLog } from './audit-log';

export type NotificationChannel = 'in-app' | 'email' | 'webhook' | 'slack' | 'browser';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationCategory = 
  | 'security' 
  | 'circuit_breaker' 
  | 'vulnerability' 
  | 'privacy' 
  | 'system'
  | 'audit';

export interface Notification {
  id: string;
  timestamp: Date;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  message: string;
  details?: Record<string, any>;
  channels: NotificationChannel[];
  userId?: string;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  snoozedUntil?: Date;
  escalated: boolean;
  escalationCount: number;
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  webhookUrl?: string;
  slackWebhookUrl?: string;
  emailRecipients?: string[];
  minPriority: NotificationPriority;
  autoEscalateAfter?: number; // minutes
  maxEscalations?: number;
}

class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private config: NotificationConfig;
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Set<(notification: Notification) => void> = new Set();

  constructor() {
    this.config = {
      channels: ['in-app'],
      minPriority: 'low',
      autoEscalateAfter: 15, // 15 minutes
      maxEscalations: 3
    };

    // Request browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
  }

  /**
   * Configure notification system
   */
  configure(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send a notification through configured channels
   */
  async send(
    priority: NotificationPriority,
    category: NotificationCategory,
    title: string,
    message: string,
    details?: Record<string, any>,
    userId?: string
  ): Promise<Notification> {
    const id = crypto.randomUUID();
    const notification: Notification = {
      id,
      timestamp: new Date(),
      priority,
      category,
      title,
      message,
      details,
      channels: this.config.channels,
      userId,
      acknowledged: false,
      escalated: false,
      escalationCount: 0
    };

    // Store notification
    this.notifications.set(id, notification);

    // Log to audit system
    await auditLog.log(
      priority === 'critical' ? 'critical' : priority === 'high' ? 'warning' : 'info',
      'security',
      'Notification sent',
      {
        userId,
        details: {
          notificationId: id,
          title,
          category,
          priority
        }
      }
    );

    // Send through each channel
    await Promise.all([
      this.sendInApp(notification),
      this.sendEmail(notification),
      this.sendWebhook(notification),
      this.sendSlack(notification),
      this.sendBrowser(notification)
    ]);

    // Setup auto-escalation if critical or high priority
    if ((priority === 'critical' || priority === 'high') && this.config.autoEscalateAfter) {
      this.setupAutoEscalation(notification);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(notification));

    return notification;
  }

  /**
   * Send in-app notification (stored in memory for UI to display)
   */
  private async sendInApp(notification: Notification): Promise<void> {
    if (!notification.channels.includes('in-app')) return;

    // Dispatch custom event for UI components to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('security-notification', {
        detail: notification
      }));
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(notification: Notification): Promise<void> {
    if (!notification.channels.includes('email') || !this.config.emailRecipients) return;

    // In production, this would call an email service API
    console.log('📧 Email notification:', {
      to: this.config.emailRecipients,
      subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
      body: notification.message,
      details: notification.details
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(notification: Notification): Promise<void> {
    if (!notification.channels.includes('webhook') || !this.config.webhookUrl) return;

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: notification.timestamp.toISOString(),
          priority: notification.priority,
          category: notification.category,
          title: notification.title,
          message: notification.message,
          details: notification.details
        })
      });

      if (!response.ok) {
        console.error('Webhook notification failed:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(notification: Notification): Promise<void> {
    if (!notification.channels.includes('slack') || !this.config.slackWebhookUrl) return;

    const colorMap: Record<NotificationPriority, string> = {
      low: '#36a64f',
      medium: '#ff9900',
      high: '#ff6600',
      critical: '#ff0000'
    };

    try {
      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color: colorMap[notification.priority],
            title: notification.title,
            text: notification.message,
            fields: [
              {
                title: 'Priority',
                value: notification.priority.toUpperCase(),
                short: true
              },
              {
                title: 'Category',
                value: notification.category,
                short: true
              },
              {
                title: 'Time',
                value: notification.timestamp.toLocaleString(),
                short: true
              }
            ],
            footer: 'ZipWiz Security System',
            ts: Math.floor(notification.timestamp.getTime() / 1000)
          }]
        })
      });

      if (!response.ok) {
        console.error('Slack notification failed:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  /**
   * Send browser notification
   */
  private async sendBrowser(notification: Notification): Promise<void> {
    if (!notification.channels.includes('browser')) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const browserNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-security.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical'
      });

      browserNotif.onclick = () => {
        window.focus();
        browserNotif.close();
      };
    } catch (error) {
      console.error('Failed to send browser notification:', error);
    }
  }

  /**
   * Setup auto-escalation timer
   */
  private setupAutoEscalation(notification: Notification): void {
    if (!this.config.autoEscalateAfter || !this.config.maxEscalations) return;
    if (notification.escalationCount >= this.config.maxEscalations) return;

    const timer = setTimeout(async () => {
      if (!notification.acknowledged && !notification.snoozedUntil) {
        await this.escalate(notification.id);
      }
    }, this.config.autoEscalateAfter * 60 * 1000);

    this.escalationTimers.set(notification.id, timer);
  }

  /**
   * Escalate a notification
   */
  async escalate(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    notification.escalated = true;
    notification.escalationCount++;

    // Log escalation
    await auditLog.log('warning', 'security', 'Notification escalated', {
      userId: notification.userId,
      details: {
        notificationId,
        escalationCount: notification.escalationCount,
        title: notification.title
      }
    });

    // Send escalation notification
    await this.send(
      'critical',
      notification.category,
      `🚨 ESCALATED: ${notification.title}`,
      `This notification has been escalated (attempt ${notification.escalationCount}). Original message: ${notification.message}`,
      {
        ...notification.details,
        originalNotificationId: notificationId,
        escalationCount: notification.escalationCount
      },
      notification.userId
    );

    // Setup next escalation if needed
    if (notification.escalationCount < (this.config.maxEscalations || 3)) {
      this.setupAutoEscalation(notification);
    }
  }

  /**
   * Acknowledge a notification
   */
  async acknowledge(notificationId: string, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    notification.acknowledged = true;
    notification.acknowledgedAt = new Date();
    notification.acknowledgedBy = userId;

    // Cancel escalation timer
    const timer = this.escalationTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(notificationId);
    }

    // Log acknowledgment
    await auditLog.log('info', 'security', 'Notification acknowledged', {
      userId,
      details: {
        notificationId,
        title: notification.title
      }
    });
  }

  /**
   * Snooze a notification
   */
  async snooze(notificationId: string, durationMinutes: number, userId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    notification.snoozedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Cancel current escalation timer
    const timer = this.escalationTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.escalationTimers.delete(notificationId);
    }

    // Setup new timer for after snooze period
    setTimeout(() => {
      notification.snoozedUntil = undefined;
      if (!notification.acknowledged) {
        this.setupAutoEscalation(notification);
      }
    }, durationMinutes * 60 * 1000);

    // Log snooze
    await auditLog.log('info', 'security', 'Notification snoozed', {
      userId,
      details: {
        notificationId,
        durationMinutes,
        title: notification.title
      }
    });
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get unacknowledged notifications
   */
  getUnacknowledged(): Notification[] {
    return this.getAll().filter(n => !n.acknowledged && !n.snoozedUntil);
  }

  /**
   * Add a notification listener
   */
  addListener(listener: (notification: Notification) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get notification statistics
   */
  getStatistics(): {
    total: number;
    unacknowledged: number;
    critical: number;
    escalated: number;
    byCategory: Record<string, number>;
  } {
    const all = this.getAll();
    const byCategory: Record<string, number> = {};

    all.forEach(n => {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
    });

    return {
      total: all.length,
      unacknowledged: all.filter(n => !n.acknowledged).length,
      critical: all.filter(n => n.priority === 'critical').length,
      escalated: all.filter(n => n.escalated).length,
      byCategory
    };
  }
}

// Singleton instance
export const notificationService = new NotificationService();

/**
 * Helper function to send security alert
 */
export async function sendSecurityAlert(
  title: string,
  message: string,
  details?: Record<string, any>,
  userId?: string
): Promise<void> {
  await notificationService.send('critical', 'security', title, message, details, userId);
}

/**
 * Helper function to send circuit breaker alert
 */
export async function sendCircuitBreakerAlert(
  circuitName: string,
  state: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  await notificationService.send(
    'high',
    'circuit_breaker',
    `Circuit Breaker '${circuitName}' ${state.toUpperCase()}`,
    reason,
    details
  );
}
