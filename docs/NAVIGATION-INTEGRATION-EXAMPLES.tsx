/**
 * INTEGRATION EXAMPLE: Enhanced Navigation in Home Page
 *
 * This file demonstrates how to integrate the EnhancedViewTabs component
 * into the existing Home component.
 *
 * IMPLEMENTATION STEPS:
 * 1. Import EnhancedViewTabs
 * 2. Replace or supplement existing view switching UI
 * 3. Configure badges based on application state
 * 4. Set up grouped views (optional)
 * 5. Handle home button functionality
 */

import { useState, useEffect } from 'react';
import { EnhancedViewTabs } from '@/components/enhanced-view-tabs';
import { MainNavigation } from '@/components/main-navigation';
import { type ViewType } from '@shared/views';

/**
 * OPTION 1: Replace Existing Navigation
 *
 * Replace the current view switching mechanism entirely with EnhancedViewTabs.
 */
export function HomeWithEnhancedNav() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [vulnerabilityCount, _setVulnerabilityCount] = useState(0);

  // Example: Configure dynamic badges based on app state
  const badgeConfig = {
    ai: { type: 'new' as const },
    'vulnerability-scanner': {
      type: 'warning' as const,
      value: vulnerabilityCount,
    },
    analytics: { type: 'beta' as const },
  };

  // Example: Group views by category
  const groupedViews = {
    Core: ['main', 'status', 'ai'] as ViewType[],
    Tools: ['analytics', 'archive-manager', 'archive-comparison'] as ViewType[],
    Security: ['vulnerability-scanner', 'privacy', 'circuit-breaker'] as ViewType[],
    Advanced: [
      'dependency-graph',
      'code-metrics',
      'pattern-recognition',
      'timing-optimizer',
    ] as ViewType[],
    Experimental: [
      'mushin',
      'wu-wei',
      'symbolic',
      'flow-manager',
      'cognitive-load',
      'memory-compression',
    ] as ViewType[],
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* Existing header navigation */}
      <MainNavigation
        onSettingsClick={() => {}}
        onShortcutsClick={() => {}}
        onStatusDashboardClick={() => setCurrentView('status')}
        onAIExplorationClick={() => setCurrentView('ai')}
        onAnalyticsClick={() => setCurrentView('analytics')}
        onUploadClick={() => {}}
        isDarkMode={isDarkMode}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
      />

      {/* NEW: Enhanced view tabs navigation */}
      <EnhancedViewTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        showHomeButton
        onHomeClick={() => setCurrentView('main')}
        badgeConfig={badgeConfig}
        groupedViews={groupedViews}
      />

      {/* Content area */}
      <main className="p-6">{renderView(currentView)}</main>
    </div>
  );
}

/**
 * OPTION 2: Supplement Existing Navigation
 *
 * Keep the existing MainNavigation header for quick actions,
 * add EnhancedViewTabs below for comprehensive view navigation.
 */
export function HomeWithSupplementalNav() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Simple badge configuration
  const badgeConfig = {
    ai: { type: 'new' as const },
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      {/* Keep existing header */}
      <MainNavigation
        onSettingsClick={() => {}}
        onShortcutsClick={() => {}}
        onStatusDashboardClick={() => setCurrentView('status')}
        onAIExplorationClick={() => setCurrentView('ai')}
        onAnalyticsClick={() => setCurrentView('analytics')}
        onUploadClick={() => {}}
        isDarkMode={isDarkMode}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Add enhanced navigation below */}
      <EnhancedViewTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        badgeConfig={badgeConfig}
      />

      {/* Content area */}
      <main className="p-6">{renderView(currentView)}</main>
    </div>
  );
}

/**
 * OPTION 3: Conditional Navigation
 *
 * Show different navigation styles based on user preferences or screen size.
 */
export function HomeWithConditionalNav() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [useEnhancedNav, _setUseEnhancedNav] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (useEnhancedNav) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <EnhancedViewTabs
          currentView={currentView}
          onViewChange={setCurrentView}
          showHomeButton
          onHomeClick={() => setCurrentView('main')}
        />
        <main className="p-6">{renderView(currentView)}</main>
      </div>
    );
  }

  // Fallback to classic navigation
  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <MainNavigation
        onSettingsClick={() => {}}
        onShortcutsClick={() => {}}
        onStatusDashboardClick={() => setCurrentView('status')}
        onAIExplorationClick={() => setCurrentView('ai')}
        onAnalyticsClick={() => setCurrentView('analytics')}
        onUploadClick={() => {}}
        isDarkMode={isDarkMode}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
      />
      <main className="p-6">{renderView(currentView)}</main>
    </div>
  );
}

/**
 * OPTION 4: Dynamic Badge Updates
 *
 * Demonstrate real-time badge updates based on application events.
 */
export function HomeWithDynamicBadges() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [isDarkMode, _setIsDarkMode] = useState(false);

  // State for dynamic badges
  const [vulnerabilities, setVulnerabilities] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [processingErrors, setProcessingErrors] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    // Example: Listen to vulnerability scan results
    const _handleVulnerabilityScan = (count: number) => {
      setVulnerabilities(count);
    };

    // Example: Listen to notification events
    const _handleNotification = () => {
      setUnreadNotifications(prev => prev + 1);
    };

    // Example: Listen to processing errors
    const _handleError = () => {
      setProcessingErrors(prev => prev + 1);
    };

    // Set up event listeners (pseudo-code)
    // window.addEventListener('vulnerability-scan', handleVulnerabilityScan);
    // window.addEventListener('notification', handleNotification);
    // window.addEventListener('processing-error', handleError);

    return () => {
      // Clean up listeners
    };
  }, []);

  // Dynamic badge configuration
  const badgeConfig = {
    'vulnerability-scanner':
      vulnerabilities > 0 ? { type: 'warning' as const, value: vulnerabilities } : undefined,
    status:
      unreadNotifications > 0 ? { type: 'count' as const, value: unreadNotifications } : undefined,
    'circuit-breaker':
      processingErrors > 0 ? { type: 'warning' as const, value: processingErrors } : undefined,
    ai: { type: 'new' as const },
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <EnhancedViewTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        showHomeButton
        onHomeClick={() => {
          setCurrentView('main');
          // Clear notifications when returning home
          setUnreadNotifications(0);
        }}
        badgeConfig={badgeConfig}
      />
      <main className="p-6">{renderView(currentView)}</main>
    </div>
  );
}

/**
 * OPTION 5: Role-Based View Visibility
 *
 * Show/hide views based on user permissions.
 */
export function HomeWithRoleBasedNav({ userRole }: { userRole: 'admin' | 'user' | 'guest' }) {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [isDarkMode, _setIsDarkMode] = useState(false);

  // Configure visibility based on role
  const hiddenViews: ViewType[] = [];
  const disabledViews: ViewType[] = [];

  if (userRole === 'guest') {
    hiddenViews.push('analytics', 'vulnerability-scanner', 'code-metrics');
    disabledViews.push('ai', 'archive-manager');
  } else if (userRole === 'user') {
    disabledViews.push('circuit-breaker');
  }
  // Admin sees everything

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <EnhancedViewTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        showHomeButton
        onHomeClick={() => setCurrentView('main')}
        hiddenViews={hiddenViews}
        disabledViews={disabledViews}
      />
      <main className="p-6">{renderView(currentView)}</main>
    </div>
  );
}

/**
 * Helper function to render view content
 */
function renderView(view: ViewType): JSX.Element {
  // Implementation would match the existing renderCurrentView() in home.tsx
  return <div>View: {view}</div>;
}

/**
 * RECOMMENDED INTEGRATION APPROACH
 *
 * For the ZipWizard project, we recommend Option 2 (Supplemental Navigation):
 *
 * 1. Keep MainNavigation header for:
 *    - Logo and branding
 *    - Quick actions (Upload, Help, Settings)
 *    - Theme toggle
 *    - User menu
 *
 * 2. Add EnhancedViewTabs below header for:
 *    - Comprehensive view navigation
 *    - Keyboard shortcuts
 *    - Visual feedback
 *    - Badge notifications
 *
 * This approach provides:
 * ✅ Minimal disruption to existing UI
 * ✅ Clear separation of concerns
 * ✅ Enhanced navigation without losing existing features
 * ✅ Easy rollback if needed
 *
 * IMPLEMENTATION STEPS:
 *
 * 1. In client/src/pages/home.tsx, add import:
 *    ```tsx
 *    import { EnhancedViewTabs } from "@/components/enhanced-view-tabs";
 *    ```
 *
 * 2. Find the MainNavigation component (around line 1100)
 *
 * 3. Add EnhancedViewTabs immediately after MainNavigation:
 *    ```tsx
 *    <MainNavigation {...existingProps} />
 *    <EnhancedViewTabs
 *      currentView={currentView}
 *      onViewChange={setCurrentView}
 *      showHomeButton
 *      onHomeClick={() => setCurrentView('main')}
 *    />
 *    ```
 *
 * 4. Import CSS in App.tsx or index.css:
 *    ```css
 *    @import '@/components/enhanced-navigation.css';
 *    ```
 *
 * 5. Test keyboard shortcuts (1-9, arrows, Home/End)
 *
 * 6. Add badge configuration as needed
 */
