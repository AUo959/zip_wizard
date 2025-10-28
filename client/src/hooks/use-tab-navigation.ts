/**
 * NAVIGATION HOOKS AND UTILITIES
 *
 * Custom hooks for enhanced tab navigation with keyboard support,
 * accessibility features, and state management.
 */

import { useEffect, useCallback, useState } from 'react';
import { type ViewType, ALL_VIEWS, isValidView } from '@shared/views';

/**
 * Configuration for tab navigation behavior
 */
export interface TabNavigationConfig {
  /** Enable arrow key navigation */
  enableArrowKeys?: boolean;
  /** Enable number key shortcuts (1-9) */
  enableNumberKeys?: boolean;
  /** Enable Home/End key navigation */
  enableHomeEnd?: boolean;
  /** Callback when view changes */
  onViewChange?: (view: ViewType) => void;
  /** Announce view changes for screen readers */
  announceChanges?: boolean;
}

/**
 * Custom hook for keyboard-based tab navigation.
 * Provides arrow keys, number shortcuts, and Home/End navigation.
 *
 * @param currentView - Currently active view
 * @param setCurrentView - Function to update current view
 * @param config - Navigation configuration options
 *
 * @example
 * ```typescript
 * const { handleKeyDown, focusedIndex } = useTabNavigation(
 *   currentView,
 *   setCurrentView,
 *   { enableArrowKeys: true, enableNumberKeys: true }
 * );
 * ```
 */
export function useTabNavigation(
  currentView: ViewType,
  setCurrentView: (view: ViewType) => void,
  config: TabNavigationConfig = {}
) {
  const {
    enableArrowKeys = true,
    enableNumberKeys = true,
    enableHomeEnd = true,
    onViewChange,
    announceChanges = true,
  } = config;

  const [focusedIndex, setFocusedIndex] = useState<number>(ALL_VIEWS.indexOf(currentView));

  // Update focused index when current view changes
  useEffect(() => {
    setFocusedIndex(ALL_VIEWS.indexOf(currentView));
  }, [currentView]);

  /**
   * Announces view changes to screen readers
   */
  const announceViewChange = useCallback(
    (view: ViewType) => {
      if (!announceChanges) return;

      const announcement = document.getElementById('view-announcer');
      if (announcement) {
        announcement.textContent = `Switched to ${view} view`;
      }
    },
    [announceChanges]
  );

  /**
   * Changes to a specific view by index
   */
  const navigateToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < ALL_VIEWS.length) {
        const newView = ALL_VIEWS[index];
        setCurrentView(newView);
        setFocusedIndex(index);
        announceViewChange(newView);
        onViewChange?.(newView);
      }
    },
    [setCurrentView, announceViewChange, onViewChange]
  );

  /**
   * Keyboard navigation handler
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const currentIndex = ALL_VIEWS.indexOf(currentView);

      // Arrow key navigation
      if (enableArrowKeys) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          const nextIndex = (currentIndex + 1) % ALL_VIEWS.length;
          navigateToIndex(nextIndex);
          return;
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          const prevIndex = (currentIndex - 1 + ALL_VIEWS.length) % ALL_VIEWS.length;
          navigateToIndex(prevIndex);
          return;
        }
      }

      // Home/End navigation
      if (enableHomeEnd) {
        if (event.key === 'Home') {
          event.preventDefault();
          navigateToIndex(0);
          return;
        }

        if (event.key === 'End') {
          event.preventDefault();
          navigateToIndex(ALL_VIEWS.length - 1);
          return;
        }
      }

      // Number key shortcuts (1-9)
      if (enableNumberKeys && /^[1-9]$/.test(event.key)) {
        const index = parseInt(event.key) - 1;
        if (index < ALL_VIEWS.length) {
          event.preventDefault();
          navigateToIndex(index);
        }
      }
    },
    [currentView, enableArrowKeys, enableHomeEnd, enableNumberKeys, navigateToIndex]
  );

  return {
    handleKeyDown,
    focusedIndex,
    navigateToIndex,
  };
}

/**
 * Hook for managing tab badges (NEW, BETA, notification counts)
 */
export interface TabBadge {
  type: 'new' | 'beta' | 'count' | 'warning';
  value?: number;
  label?: string;
}

export function useTabBadges(initialBadges: Partial<Record<ViewType, TabBadge>> = {}) {
  const [badges, setBadges] = useState(initialBadges);

  const setBadge = useCallback((view: ViewType, badge: TabBadge | null) => {
    setBadges(prev => {
      if (badge === null) {
        const { [view]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [view]: badge };
    });
  }, []);

  const clearBadge = useCallback(
    (view: ViewType) => {
      setBadge(view, null);
    },
    [setBadge]
  );

  const incrementCount = useCallback((view: ViewType) => {
    setBadges(prev => {
      const current = prev[view];
      if (current?.type === 'count') {
        return {
          ...prev,
          [view]: { ...current, value: (current.value || 0) + 1 },
        };
      }
      return prev;
    });
  }, []);

  return {
    badges,
    setBadge,
    clearBadge,
    incrementCount,
  };
}

/**
 * Hook for managing view visibility and permissions
 */
export interface ViewVisibility {
  hidden?: boolean;
  disabled?: boolean;
  reason?: string;
}

export function useViewVisibility(
  initialVisibility: Partial<Record<ViewType, ViewVisibility>> = {}
) {
  const [visibility, setVisibility] = useState(initialVisibility);

  const setViewVisibility = useCallback((view: ViewType, config: ViewVisibility) => {
    setVisibility(prev => ({ ...prev, [view]: config }));
  }, []);

  const hideView = useCallback(
    (view: ViewType, reason?: string) => {
      setViewVisibility(view, { hidden: true, reason });
    },
    [setViewVisibility]
  );

  const showView = useCallback(
    (view: ViewType) => {
      setViewVisibility(view, { hidden: false });
    },
    [setViewVisibility]
  );

  const disableView = useCallback(
    (view: ViewType, reason?: string) => {
      setViewVisibility(view, { disabled: true, reason });
    },
    [setViewVisibility]
  );

  const enableView = useCallback(
    (view: ViewType) => {
      setViewVisibility(view, { disabled: false });
    },
    [setViewVisibility]
  );

  const getVisibleViews = useCallback(() => {
    return ALL_VIEWS.filter(view => !visibility[view]?.hidden);
  }, [visibility]);

  return {
    visibility,
    setViewVisibility,
    hideView,
    showView,
    disableView,
    enableView,
    getVisibleViews,
  };
}

/**
 * Normalizes and validates views for navigation
 * Filters out hidden/invalid views and ensures proper ordering
 */
export function normalizeViews(
  views: readonly ViewType[],
  visibility?: Partial<Record<ViewType, ViewVisibility>>
): ViewType[] {
  return views.filter(view => {
    if (!isValidView(view)) return false;
    if (visibility?.[view]?.hidden) return false;
    return true;
  });
}
