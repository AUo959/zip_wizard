/**
 * Shows multi-user audit log and in-app notifications for collaboration.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Clock,
  FileEdit,
  Trash2,
  Download,
  Upload,
  Info,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ChangeLog {
  id: string;
  user: string;
  action: string;
  target?: string;
  timestamp: Date;
  details?: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  timestamp: Date;
  read?: boolean;
}

export interface CollaborationPanelProps {
  changes: ChangeLog[];
  notifications: Notification[];
  className?: string;
}

/**
 * Collaboration panel showing audit logs and notifications.
 */
export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  changes,
  notifications,
  className,
}) => {
  // Get icon for action type
  const getActionIcon = (action: string): React.ReactNode => {
    const iconClass = 'h-3 w-3';

    if (action.includes('edit') || action.includes('modify')) {
      return <FileEdit className={iconClass} />;
    }
    if (action.includes('delete') || action.includes('remove')) {
      return <Trash2 className={iconClass} />;
    }
    if (action.includes('download') || action.includes('extract')) {
      return <Download className={iconClass} />;
    }
    if (action.includes('upload') || action.includes('add')) {
      return <Upload className={iconClass} />;
    }

    return <Clock className={iconClass} />;
  };

  // Get icon for notification type
  const getNotificationIcon = (type: Notification['type']): React.ReactNode => {
    const iconClass = 'h-4 w-4';

    switch (type) {
      case 'info':
        return <Info className={`${iconClass} text-blue-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      default:
        return <Info className={`${iconClass}`} />;
    }
  };

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  // Sort changes by timestamp (newest first)
  const sortedChanges = [...changes].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <aside className={className}>
      <div className="space-y-4">
        {/* Notifications Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              {sortedNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No notifications
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`flex gap-2 p-2 rounded-md transition-colors ${
                        !notification.read ? 'bg-accent' : 'hover:bg-accent/50'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Activity Log Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {sortedChanges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedChanges.map((change, index) => (
                    <React.Fragment key={change.id}>
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex items-start pt-1">{getActionIcon(change.action)}</div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                <User className="h-3 w-3 inline mr-1" />
                                {change.user}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {change.action}
                                {change.target && (
                                  <span className="font-mono text-xs ml-1">{change.target}</span>
                                )}
                              </p>
                              {change.details && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {change.details}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(change.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {index < sortedChanges.length - 1 && <Separator className="my-2" />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
};

export default CollaborationPanel;
