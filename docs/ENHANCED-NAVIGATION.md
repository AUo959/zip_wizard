# Enhanced Navigation System Documentation

## Overview

The Enhanced Navigation System provides a comprehensive, accessible, and performant navigation solution for ZipWizard with:

- **Keyboard Navigation**: Full keyboard support with arrow keys, Home/End, and number shortcuts (1-9)
- **Animations**: Smooth transitions and visual feedback for all interactions
- **Responsive Design**: Adaptive layouts for desktop (horizontal tabs) and mobile (dropdown menu)
- **Badge System**: Support for NEW, BETA, count, and warning badges
- **Accessibility**: Full ARIA support, screen reader announcements, and keyboard-only navigation
- **Dark/Light Themes**: Automatic theme integration with CSS variables
- **Extensibility**: Flexible API for customization and extension

## Table of Contents

1. [Quick Start](#quick-start)
2. [Components](#components)
3. [Hooks](#hooks)
4. [API Reference](#api-reference)
5. [Keyboard Shortcuts](#keyboard-shortcuts)
6. [Styling](#styling)
7. [Accessibility](#accessibility)
8. [Examples](#examples)
9. [Testing](#testing)

---

## Quick Start

### Basic Usage

```tsx
import { EnhancedViewTabs } from '@/components/enhanced-view-tabs';
import { ViewType } from '@shared/views';
import { useState } from 'react';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('main');

  return <EnhancedViewTabs currentView={currentView} onViewChange={setCurrentView} />;
}
```

### With Badges and Home Button

```tsx
<EnhancedViewTabs
  currentView={currentView}
  onViewChange={setCurrentView}
  showHomeButton
  onHomeClick={() => setCurrentView('main')}
  badgeConfig={{
    ai: { type: 'new' },
    'vulnerability-scanner': { type: 'warning', value: 3 },
    analytics: { type: 'beta' },
  }}
/>
```

---

## Components

### EnhancedViewTabs

Main navigation component with full feature set.

#### Props

```typescript
interface EnhancedViewTabsProps {
  /** Currently active view (required) */
  currentView: ViewType;

  /** Callback when view changes (required) */
  onViewChange: (view: ViewType) => void;

  /** Optional: Group views by category */
  groupedViews?: {
    [category: string]: ViewType[];
  };

  /** Optional: Badge configurations */
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

  /** Optional: Force mobile mode */
  forceMobileMode?: boolean;

  /** Optional: Custom class name */
  className?: string;
}
```

#### Features

- **Automatic Layout Switching**: Switches between horizontal tabs (desktop) and dropdown menu (mobile ≤768px)
- **Keyboard Navigation**: Full keyboard support (see [Keyboard Shortcuts](#keyboard-shortcuts))
- **Badge Rendering**: Displays configured badges with appropriate styling
- **Visibility Control**: Respects hidden and disabled view configurations
- **Accessibility**: Complete ARIA implementation with screen reader support

---

## Hooks

### useTabNavigation

Handles keyboard navigation logic.

```typescript
const { focusedIndex, handleKeyDown, navigateToIndex } = useTabNavigation({
  viewCount: 10,
  onNavigate: index => console.log(`Navigate to ${index}`),
  currentIndex: 0,
  enableArrowKeys: true,
  enableHomeEnd: true,
  enableNumberShortcuts: true,
  wrapAround: true,
});
```

#### Parameters

- `viewCount` (required): Total number of views/tabs
- `onNavigate` (required): Callback when navigation occurs
- `currentIndex` (optional): Currently focused index (default: 0)
- `enableArrowKeys` (optional): Enable left/right arrow navigation (default: true)
- `enableHomeEnd` (optional): Enable Home/End keys (default: true)
- `enableNumberShortcuts` (optional): Enable 1-9 number shortcuts (default: true)
- `wrapAround` (optional): Wrap at boundaries (default: true)

#### Returns

- `focusedIndex`: Currently focused tab index
- `handleKeyDown`: Keyboard event handler
- `navigateToIndex`: Function to programmatically navigate to index

### useTabBadges

Manages tab badge state.

```typescript
const { badges, setBadge, clearBadge, incrementCount } = useTabBadges();

// Set a badge
setBadge('ai', 'new');

// Set count badge
setBadge('vulnerability-scanner', 'count', 5);

// Increment count
incrementCount('vulnerability-scanner'); // Now 6

// Clear badge
clearBadge('ai');
```

#### Badge Types

- `new`: Green "NEW" badge
- `beta`: Orange "BETA" badge
- `count`: Red numeric badge (requires value)
- `warning`: Orange numeric badge (requires value)

### useViewVisibility

Controls view visibility and disabled state.

```typescript
const { visibilityMap, hideView, showView, disableView, enableView, getVisibleViews } =
  useViewVisibility();

// Hide a view (removes from navigation)
hideView('ai');

// Show a view (adds back to navigation)
showView('ai');

// Disable a view (grayed out, not clickable)
disableView('analytics');

// Enable a view
enableView('analytics');

// Filter visible views
const visible = getVisibleViews(['main', 'ai', 'status']);
```

---

## API Reference

### ViewType

Centralized view type from `@shared/views`:

```typescript
type ViewType =
  | 'main'
  | 'status'
  | 'ai'
  | 'analytics'
  | 'mushin'
  | 'symbolic'
  | 'archive-manager'
  | 'privacy'
  | 'multilingual'
  | 'flow-manager'
  | 'wu-wei'
  | 'memory-compression'
  | 'cognitive-load'
  | 'pattern-recognition'
  | 'incremental-processor'
  | 'archive-comparison'
  | 'vulnerability-scanner'
  | 'dependency-graph'
  | 'code-metrics'
  | 'timing-optimizer'
  | 'circuit-breaker';
```

### VIEW_METADATA

View metadata with labels and icons:

```typescript
const VIEW_METADATA: Record<
  ViewType,
  {
    label: string;
    icon?: string;
  }
>;

// Example
VIEW_METADATA['ai'].label; // "AI Tools"
VIEW_METADATA['ai'].icon; // "🤖"
```

---

## Keyboard Shortcuts

### Global Navigation

| Key                          | Action                          |
| ---------------------------- | ------------------------------- |
| `Arrow Right` / `Arrow Down` | Next tab                        |
| `Arrow Left` / `Arrow Up`    | Previous tab                    |
| `Home`                       | First tab                       |
| `End`                        | Last tab                        |
| `1-9`                        | Jump to tab by number (1st-9th) |
| `Tab`                        | Move focus within navigation    |
| `Enter` / `Space`            | Activate focused tab            |

### Mobile Dropdown

| Key               | Action                    |
| ----------------- | ------------------------- |
| `Enter` / `Space` | Open/close dropdown       |
| `Arrow Down`      | Next item in dropdown     |
| `Arrow Up`        | Previous item in dropdown |
| `Escape`          | Close dropdown            |

---

## Styling

### CSS Variables

Customize appearance using CSS variables:

```css
.enhanced-nav {
  /* Colors */
  --nav-bg: #ffffff;
  --nav-border: #e5e7eb;
  --nav-text: #6b7280;
  --nav-text-hover: #1f2937;
  --nav-text-active: #2563eb;
  --nav-active-color: #2563eb;

  /* Effects */
  --nav-hover-bg: rgba(59, 130, 246, 0.1);
  --nav-focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.5);

  /* Tooltips */
  --nav-tooltip-bg: #1f2937;
  --nav-tooltip-text: #ffffff;
}
```

### Dark Theme

Dark theme automatically applies via `.dark` class:

```css
.dark .enhanced-nav {
  --nav-bg: #1f2937;
  --nav-border: #374151;
  --nav-text: #9ca3af;
  --nav-text-hover: #f3f4f6;
  --nav-text-active: #60a5fa;
}
```

### Custom Animations

Animations are defined in `enhanced-navigation.css`:

- `slideIn`: Active tab indicator animation
- `slideDown`: Dropdown opening animation

Customize via:

```css
.enhanced-nav {
  --nav-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Accessibility

### ARIA Implementation

- `role="tablist"`: Navigation container
- `role="tab"`: Individual tabs
- `aria-selected`: Indicates active tab
- `aria-controls`: Links tab to content panel
- `aria-disabled`: Indicates disabled tabs
- `aria-expanded`: Dropdown state (mobile)
- `aria-haspopup`: Dropdown trigger
- `role="status"` with `aria-live="polite"`: Screen reader announcements

### Keyboard Navigation

Full keyboard-only navigation support:

- Tab stops only on active tab (roving tabindex)
- Arrow key navigation between tabs
- Home/End for quick navigation
- Number shortcuts for direct access

### Screen Reader Support

```html
<!-- Current view announcement -->
<div role="status" aria-live="polite" class="sr-only">Current view: AI Tools</div>

<!-- Keyboard shortcut hints -->
<span class="sr-only">Press 1 to activate</span>
```

### Focus Management

- Visible focus indicators (`:focus-visible`)
- Custom focus ring styling
- Focus preserved after navigation
- Dropdown focus trap (mobile)

---

## Examples

### Grouped Views with Categories

```tsx
<EnhancedViewTabs
  currentView={currentView}
  onViewChange={setCurrentView}
  groupedViews={{
    'Core Features': ['main', 'status', 'ai'],
    'Advanced Tools': ['analytics', 'vulnerability-scanner'],
    Experimental: ['mushin', 'wu-wei', 'symbolic'],
  }}
/>
```

### Dynamic Badge Updates

```tsx
function NotificationSystem() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [warningCount, setWarningCount] = useState(0);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setWarningCount(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <EnhancedViewTabs
      currentView={currentView}
      onViewChange={setCurrentView}
      badgeConfig={{
        'vulnerability-scanner': {
          type: 'warning',
          value: warningCount,
        },
      }}
    />
  );
}
```

### Conditional View Visibility

```tsx
function AdminNavigation({ isAdmin }: { isAdmin: boolean }) {
  const [currentView, setCurrentView] = useState<ViewType>('main');

  return (
    <EnhancedViewTabs
      currentView={currentView}
      onViewChange={setCurrentView}
      hiddenViews={isAdmin ? [] : ['analytics', 'vulnerability-scanner']}
    />
  );
}
```

### Integration with Existing Header

```tsx
function AppLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('main');

  return (
    <div>
      {/* Existing header */}
      <MainNavigation
        onSettingsClick={() => {}}
        onShortcutsClick={() => {}}
        isDarkMode={false}
        onDarkModeToggle={() => {}}
      />

      {/* Enhanced view tabs */}
      <EnhancedViewTabs
        currentView={currentView}
        onViewChange={setCurrentView}
        showHomeButton
        onHomeClick={() => setCurrentView('main')}
      />

      {/* Content area */}
      <main>{renderView(currentView)}</main>
    </div>
  );
}
```

---

## Testing

### Running Tests

```bash
npm test enhanced-navigation.test.tsx
```

### Test Coverage

The test suite includes:

- ✅ Hook functionality (keyboard nav, badges, visibility)
- ✅ Component rendering
- ✅ User interactions (clicks, keyboard)
- ✅ Accessibility (ARIA attributes, screen readers)
- ✅ Responsive behavior (mobile/desktop)
- ✅ Badge display and updates
- ✅ View visibility and disabled state
- ✅ Grouped views with dividers
- ✅ Integration scenarios

### Example Test

```typescript
it('should navigate with keyboard and update badges', async () => {
  const onViewChange = vi.fn();

  render(
    <EnhancedViewTabs
      currentView="main"
      onViewChange={onViewChange}
      badgeConfig={{
        ai: { type: 'new' },
      }}
    />
  );

  // Press "2" to jump to second tab
  fireEvent.keyDown(screen.getByRole('tablist'), { key: '2' });

  await waitFor(() => {
    expect(onViewChange).toHaveBeenCalled();
  });

  // Verify badge is displayed
  expect(screen.getByText('NEW')).toBeInTheDocument();
});
```

---

## Performance Considerations

### Optimizations

- **useCallback**: Memoized event handlers prevent unnecessary re-renders
- **CSS Transitions**: Hardware-accelerated animations via GPU
- **Lazy Badge Updates**: Badges only re-render when changed
- **Visibility Map**: Efficient O(1) lookups for hidden/disabled views

### Best Practices

1. **Minimize Badge Updates**: Only update badges when values actually change
2. **Debounce Rapid Navigation**: Add debouncing if programmatically navigating rapidly
3. **Lazy Load View Content**: Don't render inactive view content
4. **Use CSS Variables**: Theme changes via CSS are faster than React re-renders

---

## Troubleshooting

### Common Issues

**Q: Keyboard shortcuts not working**

- Ensure the navigation component has focus
- Check that `enableNumberShortcuts` is true
- Verify no other shortcuts are conflicting

**Q: Mobile dropdown not showing**

- Check viewport width detection
- Try `forceMobileMode={true}` to force mobile layout
- Inspect CSS media queries

**Q: Badges not displaying**

- Verify `badgeConfig` prop structure
- Check console for type errors
- Ensure view names match `ViewType` exactly

**Q: Theme not applying**

- Confirm `.dark` class is on root element
- Check CSS variable declarations
- Verify `enhanced-navigation.css` is imported

---

## Migration Guide

### From Old MainNavigation

```tsx
// OLD
<MainNavigation
  onStatusDashboardClick={() => setView('status')}
  onAIExplorationClick={() => setView('ai')}
  onAnalyticsClick={() => setView('analytics')}
/>

// NEW
<EnhancedViewTabs
  currentView={currentView}
  onViewChange={setCurrentView}
/>
```

### Benefits of Migration

- ✅ **Keyboard Support**: Full keyboard navigation out of the box
- ✅ **Accessibility**: WCAG 2.1 AA compliant
- ✅ **Responsive**: Mobile-optimized automatically
- ✅ **Badges**: Built-in notification system
- ✅ **Extensible**: Easy to add new views
- ✅ **Type-Safe**: Centralized ViewType prevents typos

---

## Future Enhancements

Planned features for future releases:

- [ ] Drag-and-drop tab reordering
- [ ] Tab pinning/unpinning
- [ ] Recent/frequently used views
- [ ] Custom icon support (beyond emoji)
- [ ] Tab grouping with collapse/expand
- [ ] Keyboard shortcut customization
- [ ] Animation preferences (reduced motion)
- [ ] Virtual scrolling for 50+ tabs
- [ ] Tab search/filtering

---

## Contributing

See [ARCHITECTURE.md](../ARCHITECTURE.md) for general contribution guidelines.

### Adding a New Feature

1. Update the appropriate hook or component
2. Add comprehensive tests
3. Update this documentation
4. Submit PR with changelog entry

---

## License

This component is part of ZipWizard v2.2.6b.

For questions or issues, please open a GitHub issue.
