/**
 * ENHANCED VIEW TABS NAVIGATION COMPONENT
 *
 * Advanced navigation system with:
 * - Keyboard navigation (arrow keys, Home/End, number shortcuts 1-9)
 * - Smooth animations and visual feedback
 * - Icon and tooltip integration
 * - Responsive mobile/desktop layouts
 * - Badge system (NEW, BETA, count, warning)
 * - Full accessibility (ARIA, screen reader support)
 * - Return home button
 * - Dark/light theme support
 *
 * @module EnhancedViewTabs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Home, Menu, X } from 'lucide-react';
import { ViewType, VIEW_METADATA, ALL_VIEWS } from '@shared/views';
import {
  useTabNavigation,
  useTabBadges,
  useViewVisibility,
  normalizeViews,
  type TabBadge,
  type ViewVisibility,
} from '@/hooks/use-tab-navigation';
import './enhanced-navigation.css';

/**
 * Props for EnhancedViewTabs component
 */
interface EnhancedViewTabsProps {
  /** Currently active view */
  currentView: ViewType;

  /** Callback when view changes */
  onViewChange: (view: ViewType) => void;

  /** Optional: Group views by category (for dividers) */
  groupedViews?: {
    [category: string]: ViewType[];
  };

  /** Optional: Custom badge configurations */
  badgeConfig?: {
    [view in ViewType]?: {
      type: 'new' | 'beta' | 'count' | 'warning';
      value?: number;
    };
  };

  /** Optional: Hide specific views */
  hiddenViews?: ViewType[];

  /** Optional: Disable specific views */
  disabledViews?: ViewType[];

  /** Optional: Show home/back button */
  showHomeButton?: boolean;

  /** Optional: Home button click handler */
  onHomeClick?: () => void;

  /** Optional: Enable mobile dropdown (auto-detected by default) */
  forceMobileMode?: boolean;

  /** Optional: Custom class name */
  className?: string;
}

/**
 * Enhanced View Tabs Navigation Component
 *
 * Provides comprehensive navigation with keyboard shortcuts, animations,
 * responsive design, and full accessibility support.
 *
 * @example
 * ```tsx
 * <EnhancedViewTabs
 *   currentView={currentView}
 *   onViewChange={setCurrentView}
 *   showHomeButton
 *   badgeConfig={{
 *     ai: { type: 'new' },
 *     'vulnerability-scanner': { type: 'warning', value: 3 }
 *   }}
 * />
 * ```
 */
export function EnhancedViewTabs({
  currentView,
  onViewChange,
  groupedViews,
  badgeConfig = {},
  hiddenViews = [],
  disabledViews = [],
  showHomeButton = false,
  onHomeClick,
  forceMobileMode,
  className = '',
}: EnhancedViewTabsProps) {
  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initialize hooks with initial configs
  const initialBadges: Partial<Record<ViewType, TabBadge>> = {};
  Object.entries(badgeConfig).forEach(([view, config]) => {
    if (config) {
      initialBadges[view as ViewType] = { type: config.type, value: config.value };
    }
  });

  const initialVisibility: Partial<Record<ViewType, ViewVisibility>> = {};
  hiddenViews.forEach(view => {
    initialVisibility[view] = { hidden: true };
  });
  disabledViews.forEach(view => {
    initialVisibility[view] = { ...initialVisibility[view], disabled: true };
  });

  const { badges, setBadge } = useTabBadges(initialBadges);
  const { visibility, hideView, showView, disableView, enableView, getVisibleViews } =
    useViewVisibility(initialVisibility);

  // Get visible views using the normalized function
  const visibleViews = normalizeViews(ALL_VIEWS, visibility);

  // Keyboard navigation with view change callback
  const { handleKeyDown, focusedIndex } = useTabNavigation(currentView, onViewChange, {
    enableArrowKeys: true,
    enableNumberKeys: true,
    enableHomeEnd: true,
    announceChanges: true,
  });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when view changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [currentView]);

  // Handle tab click
  const handleTabClick = useCallback(
    (view: ViewType) => {
      if (!visibility[view]?.disabled) {
        onViewChange(view);
      }
    },
    [onViewChange, visibility]
  );

  // Toggle mobile dropdown
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen(prev => !prev);
  }, []);

  // Render a single tab button
  const renderTab = useCallback(
    (view: ViewType, index: number) => {
      const metadata = VIEW_METADATA[view];
      const badge = badges[view];
      const viewVisibility = visibility[view];
      const isActive = view === currentView;
      const isDisabled = viewVisibility?.disabled ?? false;

      // Number shortcut (1-9)
      const shortcutNumber = index < 9 ? index + 1 : null;

      return (
        <button
          key={view}
          role="tab"
          aria-selected={isActive}
          aria-controls={`panel-${view}`}
          aria-disabled={isDisabled}
          tabIndex={isActive ? 0 : -1}
          disabled={isDisabled}
          className="enhanced-nav__tab"
          onClick={() => handleTabClick(view)}
          data-view={view}
        >
          {/* Icon */}
          {metadata.icon && (
            <span className="enhanced-nav__icon" aria-hidden="true">
              {metadata.icon}
            </span>
          )}

          {/* Label */}
          <span>{metadata.label}</span>

          {/* Badge */}
          {badge && (
            <span
              className={`enhanced-nav__badge enhanced-nav__badge--${badge.type}`}
              aria-label={badge.type === 'count' ? `${badge.value} items` : badge.type}
            >
              {badge.type === 'count' ? badge.value : badge.type.toUpperCase()}
            </span>
          )}

          {/* Keyboard shortcut hint */}
          {shortcutNumber && <span className="sr-only">Press {shortcutNumber} to activate</span>}

          {/* Tooltip */}
          <span className="enhanced-nav__tooltip">
            {metadata.label}
            {shortcutNumber && ` (${shortcutNumber})`}
          </span>
        </button>
      );
    },
    [currentView, badges, visibility, handleTabClick]
  );

  // Render grouped views (with dividers)
  const renderGroupedTabs = useCallback(() => {
    if (!groupedViews) {
      return visibleViews.map((view, index) => renderTab(view, index));
    }

    return Object.entries(groupedViews).map(([category, categoryViews]) => {
      const visibleCategoryViews = categoryViews.filter(view => visibility[view]?.hidden !== true);

      if (visibleCategoryViews.length === 0) return null;

      return (
        <React.Fragment key={category}>
          <div className="enhanced-nav__divider">{category}</div>
          {visibleCategoryViews.map((view, index) => renderTab(view, index))}
        </React.Fragment>
      );
    });
  }, [groupedViews, visibleViews, visibility, renderTab]);

  // Desktop/tablet horizontal tab list
  const renderDesktopNavigation = () => (
    <nav className="enhanced-nav" aria-label="Main navigation" onKeyDown={handleKeyDown}>
      <div className="flex items-center gap-4">
        {/* Home button */}
        {showHomeButton && (
          <button
            className="enhanced-nav__home-btn"
            onClick={onHomeClick}
            aria-label="Return to home"
          >
            <Home size={16} />
            <span>Home</span>
          </button>
        )}

        {/* Tab list */}
        <div role="tablist" aria-orientation="horizontal" className="enhanced-nav__tablist">
          {groupedViews ? renderGroupedTabs() : visibleViews.map(renderTab)}
        </div>
      </div>

      {/* Screen reader announcement region */}
      <div role="status" aria-live="polite" className="sr-only">
        Current view: {VIEW_METADATA[currentView].label}
      </div>
    </nav>
  );

  // Mobile dropdown navigation
  const renderMobileNavigation = () => (
    <nav className="enhanced-nav enhanced-nav__mobile" aria-label="Main navigation">
      <div className="enhanced-nav__dropdown">
        {/* Dropdown trigger */}
        <button
          className="enhanced-nav__dropdown-trigger"
          onClick={toggleDropdown}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          <div className="flex items-center gap-2">
            <Menu size={20} />
            <span>{VIEW_METADATA[currentView].label}</span>
          </div>
          {isDropdownOpen ? <X size={20} /> : <span>▼</span>}
        </button>

        {/* Home button in dropdown header */}
        {showHomeButton && isDropdownOpen && (
          <div className="p-2 border-b border-gray-200">
            <button
              className="enhanced-nav__home-btn w-full"
              onClick={onHomeClick}
              aria-label="Return to home"
            >
              <Home size={16} />
              <span>Home</span>
            </button>
          </div>
        )}

        {/* Dropdown content */}
        {isDropdownOpen && (
          <div role="tablist" className="enhanced-nav__dropdown-content" onKeyDown={handleKeyDown}>
            {groupedViews ? renderGroupedTabs() : visibleViews.map(renderTab)}
          </div>
        )}
      </div>

      {/* Screen reader announcement region */}
      <div role="status" aria-live="polite" className="sr-only">
        Current view: {VIEW_METADATA[currentView].label}
      </div>
    </nav>
  );

  // Determine which layout to render
  const shouldUseMobile = forceMobileMode ?? isMobile;

  return (
    <div className={`enhanced-view-tabs ${className}`}>
      {shouldUseMobile ? renderMobileNavigation() : renderDesktopNavigation()}
    </div>
  );
}

/**
 * Hook to manage navigation state (convenience wrapper)
 *
 * @example
 * ```tsx
 * function App() {
 *   const { currentView, setCurrentView } = useEnhancedViewTabs('main');
 *
 *   return (
 *     <EnhancedViewTabs
 *       currentView={currentView}
 *       onViewChange={setCurrentView}
 *     />
 *   );
 * }
 * ```
 */
export function useEnhancedViewTabs(initialView: ViewType = 'main') {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);

  return {
    currentView,
    setCurrentView,
  };
}

export default EnhancedViewTabs;
