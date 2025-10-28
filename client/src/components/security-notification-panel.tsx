/**
 * Security Notification Panel
 * 
 * Displays real-time security notifications with acknowledgment and snooze capabilities.
 * Integrates with the multi-channel notification system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SecurityAlert, SecurityBadge } from './security-badge';
import {
  Bell,
  BellOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  Zap,
  Lock,
  Activity
} from 'lucide-react';

interface Notification {
  id: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'circuit_breaker' | 'vulnerability' | 'privacy' | 'system' | 'audit';
  title: string;
  message: string;
  details?: Record<string, any>;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  snoozedUntil?: Date;
  escalated: boolean;
  escalationCount: number;
}

export function SecurityNotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const [showPanel, setShowPanel] = useState(false);

  // Listen for security notifications
  useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail as Notification;
      setNotifications(prev => [notification, ...prev]);
      
      // Auto-show panel for critical notifications
      if (notification.priority === 'critical') {
        setShowPanel(true);
      }
    };

    window.addEventListener('security-notification', handleNotification as any);
    return () => {
      window.removeEventListener('security-notification', handleNotification as any);
    };
  }, []);

  const handleAcknowledge = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, acknowledged: true, acknowledgedAt: new Date() }
          : n
      )
    );

    // Call API to acknowledge
    try {
      await fetch(`/api/v1/notifications/${id}/acknowledge`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to acknowledge notification:', error);
    }
  }, []);

  const handleSnooze = useCallback(async (id: string, durationHours: number) => {
    const snoozedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    
    setNotifications(prev =>
      prev.map(n =>
        n.id === id
          ? { ...n, snoozedUntil }
          : n
      )
    );

    // Call API to snooze
    try {
      await fetch(`/api/v1/notifications/${id}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationMinutes: durationHours * 60 })
      });
    } catch (error) {
      console.error('Failed to snooze notification:', error);
    }
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'circuit_breaker':
        return <Zap className="w-4 h-4" />;
      case 'vulnerability':
        return <AlertTriangle className="w-4 h-4" />;
      case 'privacy':
        return <Lock className="w-4 h-4" />;
      case 'system':
        return <Activity className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') {
      return !n.acknowledged && (!n.snoozedUntil || n.snoozedUntil < new Date());
    }
    return true;
  });

  const unreadCount = notifications.filter(n => 
    !n.acknowledged && (!n.snoozedUntil || n.snoozedUntil < new Date())
  ).length;

  const criticalCount = notifications.filter(n => 
    n.priority === 'critical' && !n.acknowledged
  ).length;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      {showPanel && (
        <Card className="absolute right-0 top-12 w-[450px] max-h-[600px] shadow-xl border-2 z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Security Notifications
              </CardTitle>
              <div className="flex items-center gap-2">
                <SecurityBadge
                  severity={criticalCount > 0 ? 'critical' : 'info'}
                  count={unreadCount}
                  label="Unread"
                  showIcon={false}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPanel(false)}
                  aria-label="Close notifications"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mt-3">
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="flex-1"
              >
                Unread ({unreadCount})
              </Button>
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className="flex-1"
              >
                All ({notifications.length})
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredNotifications.map((notification) => (
                    <SecurityAlert
                      key={notification.id}
                      id={notification.id}
                      severity={
                        notification.priority === 'critical' ? 'critical' :
                        notification.priority === 'high' ? 'warning' :
                        'info'
                      }
                      title={
                        <>
                          {getCategoryIcon(notification.category)}
                          {notification.title}
                          {notification.escalated && (
                            <Badge variant="destructive" className="text-xs">
                              Escalated ({notification.escalationCount})
                            </Badge>
                          )}
                        </>
                      }
                      description={notification.message}
                      timestamp={notification.timestamp}
                      dismissible={notification.acknowledged}
                      onDismiss={handleAcknowledge}
                      onSnooze={handleSnooze}
                      details={notification.details}
                      canExport={true}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer Actions */}
            {filteredNotifications.length > 0 && (
              <div className="border-t p-3 bg-muted/30">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      filteredNotifications.forEach(n => handleAcknowledge(n.id));
                    }}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Acknowledge All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const exportData = {
                        exportedAt: new Date().toISOString(),
                        notifications: filteredNotifications
                      };
                      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                        type: 'application/json' 
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `security-notifications-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1"
                  >
                    Export
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
