/**
 * Unified Security Badge Component
 * 
 * Provides accessible, keyboard-navigable security badges and alerts.
 * Supports Info, Warning, and Critical severity levels.
 * All badges are ARIA-compliant and screen reader compatible.
 */

import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Bell,
  BellOff,
  ExternalLink 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export type SecuritySeverity = 'info' | 'warning' | 'critical' | 'success';

export interface SecurityBadgeProps {
  severity: SecuritySeverity;
  count?: number;
  label?: string;
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
  pulse?: boolean;
}

export interface SecurityAlertProps {
  id: string;
  severity: SecuritySeverity;
  title: string | React.ReactNode;
  description: string;
  timestamp?: Date;
  dismissible?: boolean;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string, duration: number) => void;
  details?: Record<string, any>;
  canExport?: boolean;
}

/**
 * Get color scheme for severity level
 */
function getSeverityColors(severity: SecuritySeverity): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-300 dark:border-red-700',
        icon: 'text-red-600 dark:text-red-400'
      };
    case 'warning':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-300 dark:border-yellow-700',
        icon: 'text-yellow-600 dark:text-yellow-400'
      };
    case 'success':
      return {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-300 dark:border-green-700',
        icon: 'text-green-600 dark:text-green-400'
      };
    default: // info
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-800 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400'
      };
  }
}

/**
 * Get icon for severity level
 */
function getSeverityIcon(severity: SecuritySeverity): React.ReactNode {
  const iconProps = { className: 'h-4 w-4', 'aria-hidden': true };
  
  switch (severity) {
    case 'critical':
      return <AlertCircle {...iconProps} />;
    case 'warning':
      return <AlertTriangle {...iconProps} />;
    case 'success':
      return <CheckCircle {...iconProps} />;
    default: // info
      return <Info {...iconProps} />;
  }
}

/**
 * Security Badge Component
 * Displays severity indicators with optional counts
 */
export function SecurityBadge({
  severity,
  count,
  label,
  onClick,
  className = '',
  showIcon = true,
  pulse = false
}: SecurityBadgeProps) {
  const colors = getSeverityColors(severity);
  const icon = getSeverityIcon(severity);

  const badgeContent = (
    <>
      {showIcon && <span className="mr-1">{icon}</span>}
      {label || severity.toUpperCase()}
      {count !== undefined && count > 0 && (
        <span className="ml-1 font-bold">({count})</span>
      )}
    </>
  );

  const ariaLabel = `${severity} severity${count !== undefined ? `, ${count} items` : ''}${label ? `: ${label}` : ''}`;

  return (
    <Badge
      variant="outline"
      className={`
        ${colors.bg} ${colors.text} ${colors.border}
        ${pulse ? 'animate-pulse' : ''}
        ${onClick ? 'cursor-pointer hover:opacity-80 focus:ring-2 focus:ring-offset-2' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={ariaLabel}
    >
      {badgeContent}
    </Badge>
  );
}

/**
 * Security Alert Component
 * Full-featured alert with acknowledgment, snooze, and export capabilities
 */
export function SecurityAlert({
  id,
  severity,
  title,
  description,
  timestamp,
  dismissible = true,
  actionLabel,
  actionHref,
  onAction,
  onDismiss,
  onSnooze,
  details,
  canExport = true
}: SecurityAlertProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);
  const colors = getSeverityColors(severity);
  const icon = getSeverityIcon(severity);

  const handleDismiss = useCallback(() => {
    if (onDismiss) {
      onDismiss(id);
    }
  }, [id, onDismiss]);

  const handleSnooze = useCallback((hours: number) => {
    if (onSnooze) {
      onSnooze(id, hours);
    }
    setShowSnoozeDialog(false);
  }, [id, onSnooze]);

  const handleExport = useCallback(() => {
    const exportData = {
      id,
      severity,
      title,
      description,
      timestamp: timestamp?.toISOString(),
      details
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-alert-${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [id, severity, title, description, timestamp, details]);

  return (
    <>
      <Alert 
        className={`${colors.border} ${colors.bg} border-l-4`}
        role="alert"
        aria-live={severity === 'critical' ? 'assertive' : 'polite'}
      >
        <div className="flex items-start gap-3">
          <div className={colors.icon} aria-hidden="true">
            {icon}
          </div>
          
          <div className="flex-1">
            <AlertTitle className={`${colors.text} font-semibold`}>
              {title}
              {timestamp && (
                <span className="ml-2 text-xs font-normal opacity-75">
                  {timestamp.toLocaleString()}
                </span>
              )}
            </AlertTitle>
            <AlertDescription className={`${colors.text} mt-2`}>
              {description}
            </AlertDescription>

            <div className="flex flex-wrap gap-2 mt-4">
              {actionLabel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAction}
                  className="text-xs"
                  aria-label={actionLabel}
                >
                  {actionLabel}
                  {actionHref && <ExternalLink className="ml-1 h-3 w-3" />}
                </Button>
              )}

              {details && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs"
                  aria-label={showDetails ? 'Hide details' : 'Show details'}
                  aria-expanded={showDetails}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              )}

              {canExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="text-xs"
                  aria-label="Export alert details"
                >
                  Export
                </Button>
              )}

              {onSnooze && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSnoozeDialog(true)}
                  className="text-xs"
                  aria-label="Snooze this alert"
                >
                  <BellOff className="h-3 w-3 mr-1" />
                  Snooze
                </Button>
              )}
            </div>

            {showDetails && details && (
              <div className="mt-4 p-3 bg-background/50 rounded border text-xs">
                <pre className="whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {dismissible && onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Alert>

      {/* Snooze Dialog */}
      <Dialog open={showSnoozeDialog} onOpenChange={setShowSnoozeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snooze Alert</DialogTitle>
            <DialogDescription>
              How long would you like to snooze this alert?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button onClick={() => handleSnooze(1)}>1 hour</Button>
            <Button onClick={() => handleSnooze(4)}>4 hours</Button>
            <Button onClick={() => handleSnooze(24)}>24 hours</Button>
            <Button onClick={() => handleSnooze(168)}>1 week</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSnoozeDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Security Badge Group
 * Display multiple badges in a compact, accessible format
 */
export interface SecurityBadgeGroupProps {
  badges: SecurityBadgeProps[];
  className?: string;
}

export function SecurityBadgeGroup({ badges, className = '' }: SecurityBadgeGroupProps) {
  if (badges.length === 0) return null;

  return (
    <div 
      className={`flex flex-wrap gap-2 ${className}`}
      role="group"
      aria-label="Security status indicators"
    >
      {badges.map((badge, index) => (
        <SecurityBadge key={index} {...badge} />
      ))}
    </div>
  );
}
