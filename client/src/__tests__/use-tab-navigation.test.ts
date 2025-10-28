/**
 * ENHANCED NAVIGATION HOOKS TESTS
 *
 * Tests for useTabNavigation, useTabBadges, and useViewVisibility hooks
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useTabNavigation,
  useTabBadges,
  useViewVisibility,
  normalizeViews,
} from '../hooks/use-tab-navigation';
import { ALL_VIEWS } from '@shared/views';

describe('useTabNavigation', () => {
  it('should initialize with current view', () => {
    const setView = vi.fn();
    const { result } = renderHook(() => useTabNavigation('main', setView));

    expect(result.current.handleKeyDown).toBeInstanceOf(Function);
  });

  it('should navigate with arrow keys when enabled', () => {
    const setView = vi.fn();
    const { result } = renderHook(() =>
      useTabNavigation('main', setView, { enableArrowKeys: true })
    );

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    act(() => {
      result.current.handleKeyDown(event as unknown as React.KeyboardEvent);
    });

    expect(setView).toHaveBeenCalled();
  });

  it('should navigate with number keys when enabled', () => {
    const setView = vi.fn();
    const { result } = renderHook(() =>
      useTabNavigation('main', setView, { enableNumberKeys: true })
    );

    const event = new KeyboardEvent('keydown', { key: '2' });
    act(() => {
      result.current.handleKeyDown(event as unknown as React.KeyboardEvent);
    });

    expect(setView).toHaveBeenCalled();
  });

  it('should navigate with Home/End keys when enabled', () => {
    const setView = vi.fn();
    const { result } = renderHook(() => useTabNavigation('main', setView, { enableHomeEnd: true }));

    const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
    act(() => {
      result.current.handleKeyDown(homeEvent as unknown as React.KeyboardEvent);
    });

    expect(setView).toHaveBeenCalled();
  });
});

describe('useTabBadges', () => {
  it('should initialize with empty badges', () => {
    const { result } = renderHook(() => useTabBadges());

    expect(result.current.badges).toEqual({});
  });

  it('should initialize with provided badges', () => {
    const initialBadges = {
      ai: { type: 'new' as const },
    };

    const { result } = renderHook(() => useTabBadges(initialBadges));

    expect(result.current.badges.ai).toEqual({ type: 'new' });
  });

  it('should set a badge', () => {
    const { result } = renderHook(() => useTabBadges());

    act(() => {
      result.current.setBadge('ai', { type: 'new' });
    });

    expect(result.current.badges.ai).toEqual({ type: 'new' });
  });

  it('should clear a badge', () => {
    const initialBadges = {
      ai: { type: 'new' as const },
    };

    const { result } = renderHook(() => useTabBadges(initialBadges));

    act(() => {
      result.current.clearBadge('ai');
    });

    expect(result.current.badges.ai).toBeUndefined();
  });

  it('should increment count badge', () => {
    const initialBadges = {
      status: { type: 'count' as const, value: 5 },
    };

    const { result } = renderHook(() => useTabBadges(initialBadges));

    act(() => {
      result.current.incrementCount('status');
    });

    expect(result.current.badges.status?.value).toBe(6);
  });
});

describe('useViewVisibility', () => {
  it('should initialize with no hidden views', () => {
    const { result } = renderHook(() => useViewVisibility());

    expect(result.current.visibility).toEqual({});
  });

  it('should hide a view', () => {
    const { result } = renderHook(() => useViewVisibility());

    act(() => {
      result.current.hideView('ai');
    });

    expect(result.current.visibility.ai?.hidden).toBe(true);
  });

  it('should show a hidden view', () => {
    const { result } = renderHook(() => useViewVisibility());

    act(() => {
      result.current.hideView('ai');
      result.current.showView('ai');
    });

    expect(result.current.visibility.ai?.hidden).toBe(false);
  });

  it('should disable a view', () => {
    const { result } = renderHook(() => useViewVisibility());

    act(() => {
      result.current.disableView('analytics');
    });

    expect(result.current.visibility.analytics?.disabled).toBe(true);
  });

  it('should enable a disabled view', () => {
    const { result } = renderHook(() => useViewVisibility());

    act(() => {
      result.current.disableView('analytics');
      result.current.enableView('analytics');
    });

    expect(result.current.visibility.analytics?.disabled).toBe(false);
  });

  it('should filter visible views', () => {
    const { result } = renderHook(() => useViewVisibility());

    act(() => {
      result.current.hideView('ai');
    });

    const visibleViews = result.current.getVisibleViews();

    expect(visibleViews).not.toContain('ai');
    expect(visibleViews).toContain('main');
  });
});

describe('normalizeViews', () => {
  it('should return all views when no visibility config', () => {
    const result = normalizeViews(ALL_VIEWS);

    expect(result).toEqual(ALL_VIEWS);
  });

  it('should filter hidden views', () => {
    const visibility = {
      ai: { hidden: true },
    };

    const result = normalizeViews(ALL_VIEWS, visibility);

    expect(result).not.toContain('ai');
    expect(result).toContain('main');
  });

  it('should keep disabled views', () => {
    const visibility = {
      analytics: { disabled: true },
    };

    const result = normalizeViews(ALL_VIEWS, visibility);

    expect(result).toContain('analytics');
  });
});
