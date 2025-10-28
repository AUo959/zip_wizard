# Testing Infrastructure

This document describes the comprehensive testing infrastructure that has been set up for the ZIP Wizard project.

## Overview

The project now includes:

- **Unit Testing**: Vitest with React Testing Library
- **Code Quality**: ESLint for linting
- **Code Formatting**: Prettier for consistent code style
- **CI/CD**: GitHub Actions workflows for automated testing

## Test Framework

### Vitest Configuration

- **Location**: `vitest.config.ts`
- **Environment**: jsdom (for DOM simulation)
- **Coverage**: V8 provider with HTML and text reports
- **Global APIs**: describe, it, expect, beforeEach, afterEach, etc.

### Test Setup

- **Location**: `client/src/__tests__/setup.ts`
- **Mocks**:
  - `window.matchMedia` for responsive design tests
  - `IntersectionObserver` for visibility tracking
  - `ResizeObserver` for size change detection

## Test Suites

### Hook Tests (`use-tab-navigation.test.ts`)

Tests for the navigation hooks:

- **useTabNavigation**: Arrow keys, number keys (1-9), Home/End navigation
- **useTabBadges**: Set, clear, increment badge operations
- **useViewVisibility**: Hide, show, disable, enable view operations
- **normalizeViews**: View filtering and normalization

Total: 18 tests

### Component Tests (`enhanced-view-tabs.test.tsx`)

Tests for the EnhancedViewTabs component:

- **Rendering**: Tab display, active states, icon rendering
- **Interaction**: Click handling, tab switching
- **Badges**: NEW, BETA, count, warning badge display
- **Visibility**: Hidden and disabled view handling
- **Home Button**: Display and click behavior
- **Grouped Views**: Category organization
- **Accessibility**: ARIA attributes, screen reader support
- **Keyboard Navigation**: Shortcut key handling

Total: 21 tests

## Commands

### Testing

```bash
npm run test          # Run tests in watch mode
npm run test:ui       # Run tests with UI interface
npm run test:coverage # Run tests with coverage report
npm run test:run      # Run tests once (CI mode)
```

### Code Quality

```bash
npm run check         # TypeScript type checking
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues automatically
npm run format        # Format code with Prettier
npm run format:check  # Check code formatting
npm run validate      # Run all checks (typecheck + format + tests)
```

## GitHub Actions Workflows

### Main CI Pipeline (`ci.yml`)

Runs on every push and pull request:

1. **typecheck**: TypeScript compilation check
2. **format**: Prettier format verification
3. **test**: Run all tests with coverage
   - Uploads coverage to Codecov
4. **build**: Build the application
   - Uploads build artifacts (7-day retention)
5. **validate**: Final validation check

### Navigation Tests (`navigation-tests.yml`)

Runs when navigation files change:

1. **navigation-tests**: Run navigation-specific tests
   - Uploads coverage reports
2. **accessibility-check**: Test ARIA compliance
3. **keyboard-navigation-check**: Test keyboard shortcuts

### Code Quality (`code-quality.yml`)

Runs weekly and on pushes:

1. **code-quality**: Full validation + bundle size check
2. **security**: Trivy vulnerability scanner
3. **documentation**: Check for missing docs

## Test Coverage

Current coverage focuses on:

- Navigation hooks and state management
- Component rendering and interaction
- Badge system functionality
- Accessibility features
- Keyboard navigation

## Adding New Tests

### Hook Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useYourHook } from '@/hooks/use-your-hook';

describe('useYourHook', () => {
  it('should do something', () => {
    const { result } = renderHook(() => useYourHook());

    act(() => {
      result.current.doSomething();
    });

    expect(result.current.value).toBe('expected');
  });
});
```

### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '@/components/your-component';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);

    expect(screen.getByText('Some Text')).toBeInTheDocument();
  });

  it('should handle clicks', () => {
    const handleClick = vi.fn();
    render(<YourComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Accessibility**: Ensure all interactive elements are accessible
4. **Coverage**: Aim for 80%+ coverage on critical paths
5. **Fast Tests**: Keep tests fast by mocking expensive operations
6. **Isolation**: Each test should be independent and not affect others

## Troubleshooting

### Tests Failing Locally

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests
npm run test:run
```

### Coverage Issues

```bash
# Generate detailed coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

### ESLint Issues

```bash
# Auto-fix linting issues
npm run lint:fix

# Check specific files
npx eslint client/src/components/your-component.tsx
```

## Future Improvements

- [ ] Add E2E tests with Playwright
- [ ] Increase test coverage to 90%+
- [ ] Add performance benchmarks
- [ ] Add visual regression tests
- [ ] Set up test parallelization
- [ ] Add mutation testing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
