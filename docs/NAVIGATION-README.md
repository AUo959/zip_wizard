# Enhanced Navigation System - Quick Reference

## 🚀 Quick Start

```tsx
import { EnhancedViewTabs } from '@/components/enhanced-view-tabs';

function App() {
  const [view, setView] = useState<ViewType>('main');
  return <EnhancedViewTabs currentView={view} onViewChange={setView} />;
}
```

## ⌨️ Keyboard Shortcuts

| Key     | Action            |
| ------- | ----------------- |
| `1-9`   | Jump to tab 1-9   |
| `←` `→` | Previous/Next tab |
| `Home`  | First tab         |
| `End`   | Last tab          |

## 📋 Files Created

### Components

- `client/src/components/enhanced-view-tabs.tsx` - Main navigation component
- `client/src/components/enhanced-navigation.css` - Styling with animations and themes

### Hooks

- `client/src/hooks/use-tab-navigation.ts` - Navigation hooks (keyboard, badges, visibility)

### Tests

- `client/src/__tests__/enhanced-navigation.test.tsx` - Comprehensive test suite

### Documentation

- `docs/ENHANCED-NAVIGATION.md` - Complete documentation
- `docs/NAVIGATION-INTEGRATION-EXAMPLES.tsx` - Integration examples

## 🎨 Features

✅ **Keyboard Navigation** - Arrow keys, Home/End, number shortcuts (1-9)  
✅ **Animations** - Smooth transitions and visual feedback  
✅ **Responsive** - Desktop tabs, mobile dropdown  
✅ **Badges** - NEW, BETA, count, warning notifications  
✅ **Accessibility** - ARIA labels, screen reader support, focus management  
✅ **Themes** - Dark/light mode with CSS variables  
✅ **Extensible** - Group views, hide/disable, custom badges

## 📦 Props

```typescript
interface EnhancedViewTabsProps {
  currentView: ViewType;           // Required: active view
  onViewChange: (view) => void;    // Required: view change handler

  // Optional
  showHomeButton?: boolean;        // Show return home button
  onHomeClick?: () => void;        // Home button handler
  badgeConfig?: {...};             // Configure badges
  groupedViews?: {...};            // Group views with dividers
  hiddenViews?: ViewType[];        // Hide specific views
  disabledViews?: ViewType[];      // Disable specific views
  forceMobileMode?: boolean;       // Force mobile layout
  className?: string;              // Custom CSS class
}
```

## 🔧 Badge Configuration

```tsx
badgeConfig={{
  ai: { type: 'new' },                           // Green NEW badge
  analytics: { type: 'beta' },                   // Orange BETA badge
  'vulnerability-scanner': {                     // Red count badge
    type: 'count',
    value: 5
  },
  'circuit-breaker': {                           // Orange warning badge
    type: 'warning',
    value: 3
  }
}}
```

## 📱 Responsive Behavior

- **Desktop (>768px)**: Horizontal tab list with tooltips
- **Mobile (≤768px)**: Dropdown menu with expandable list
- **Auto-detection**: Automatically switches based on viewport width
- **Force mode**: Use `forceMobileMode` prop to override

## ♿ Accessibility

- **ARIA Compliant**: Full tablist/tab/tabpanel structure
- **Screen Reader**: Announces current view on change
- **Keyboard Only**: Complete keyboard navigation support
- **Focus Management**: Visible focus indicators, roving tabindex
- **WCAG 2.1 AA**: Meets accessibility standards

## 🎯 Integration

### Option 1: Standalone

```tsx
<EnhancedViewTabs currentView={view} onViewChange={setView} />
```

### Option 2: With Header

```tsx
<MainNavigation {...headerProps} />
<EnhancedViewTabs
  currentView={view}
  onViewChange={setView}
  showHomeButton
/>
```

### Option 3: Grouped Views

```tsx
<EnhancedViewTabs
  currentView={view}
  onViewChange={setView}
  groupedViews={{
    Core: ['main', 'status', 'ai'],
    Tools: ['analytics', 'archive-manager'],
  }}
/>
```

## 🧪 Testing

```bash
# Run tests
npm test enhanced-navigation.test.tsx

# Watch mode
npm test -- --watch enhanced-navigation.test.tsx
```

Test coverage:

- ✅ Keyboard navigation
- ✅ Badge management
- ✅ View visibility
- ✅ Responsive behavior
- ✅ Accessibility (ARIA)
- ✅ User interactions

## 🎨 Theming

### CSS Variables

```css
.enhanced-nav {
  --nav-bg: #ffffff;
  --nav-border: #e5e7eb;
  --nav-text: #6b7280;
  --nav-text-active: #2563eb;
  --nav-hover-bg: rgba(59, 130, 246, 0.1);
}
```

### Dark Theme

Add `.dark` class to root element:

```tsx
<div className={isDarkMode ? 'dark' : ''}>
  <EnhancedViewTabs {...props} />
</div>
```

## 🔍 Hooks API

### useTabNavigation

```tsx
const { handleKeyDown, focusedIndex, navigateToIndex } = useTabNavigation({
  viewCount: 10,
  onNavigate: index => {},
  enableNumberShortcuts: true,
});
```

### useTabBadges

```tsx
const { badges, setBadge, clearBadge, incrementCount } = useTabBadges();

setBadge('ai', 'new');
setBadge('scanner', 'count', 5);
incrementCount('scanner'); // Now 6
clearBadge('ai');
```

### useViewVisibility

```tsx
const { visibilityMap, hideView, showView, disableView, enableView } = useViewVisibility();

hideView('ai'); // Remove from navigation
showView('ai'); // Add back to navigation
disableView('tools'); // Gray out, not clickable
enableView('tools'); // Re-enable
```

## 📚 Documentation

- **Full Docs**: `docs/ENHANCED-NAVIGATION.md`
- **Examples**: `docs/NAVIGATION-INTEGRATION-EXAMPLES.tsx`
- **Architecture**: `ARCHITECTURE.md`

## 🐛 Troubleshooting

**Keyboard shortcuts not working?**

- Navigation must have focus
- Check `enableNumberShortcuts` is true
- Verify no conflicting shortcuts

**Badges not showing?**

- Check `badgeConfig` structure
- Verify view names match `ViewType`
- Check console for errors

**Theme not applying?**

- Confirm `.dark` class on root
- Verify CSS variables are defined
- Import `enhanced-navigation.css`

## 📝 License

Part of ZipWizard v2.2.6b

---

**For detailed documentation, see:** `docs/ENHANCED-NAVIGATION.md`  
**For integration examples, see:** `docs/NAVIGATION-INTEGRATION-EXAMPLES.tsx`
