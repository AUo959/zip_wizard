/**
 * Displays navigation stack for analyzing nested archives.
 * Each breadcrumb is clickable to jump to that level.
 */

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ArchiveBreadcrumbsProps {
  stack: string[];
  onJump: (_level: number) => void;
  className?: string;
}

/**
 * Archive breadcrumb navigation for nested archives.
 * Shows the current path through nested archives.
 */
export const ArchiveBreadcrumbs: React.FC<ArchiveBreadcrumbsProps> = ({
  stack,
  onJump,
  className,
}) => {
  return (
    <nav
      aria-label="Archive breadcrumbs"
      className={cn('flex items-center gap-1 flex-wrap', className)}
    >
      {/* Home button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onJump(0)}
        className="h-8 px-2"
        title="Go to root"
      >
        <Home className="h-4 w-4" />
      </Button>

      {/* Breadcrumb items */}
      {stack.map((name, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={i === stack.length - 1 ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onJump(i)}
            className={cn(
              'h-8 px-2 max-w-[200px] truncate',
              i === stack.length - 1 && 'font-semibold'
            )}
            title={name}
          >
            {name}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default ArchiveBreadcrumbs;
