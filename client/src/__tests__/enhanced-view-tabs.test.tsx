/**
 * ENHANCED VIEW TABS COMPONENT TESTS
 *
 * Tests for the EnhancedViewTabs component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedViewTabs } from '../components/enhanced-view-tabs';
import type { ViewType } from '@shared/views';

describe('EnhancedViewTabs', () => {
  const defaultProps = {
    currentView: 'main' as ViewType,
    onViewChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<EnhancedViewTabs {...defaultProps} />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should render tablist', () => {
      render(<EnhancedViewTabs {...defaultProps} />);

      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should render multiple tabs', () => {
      render(<EnhancedViewTabs {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);
    });

    it('should mark current view as selected', () => {
      render(<EnhancedViewTabs {...defaultProps} currentView="ai" />);

      const aiTab = screen.getByRole('tab', { name: /ai/i });
      expect(aiTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Interaction', () => {
    it('should call onViewChange when tab is clicked', async () => {
      const onViewChange = vi.fn();
      render(<EnhancedViewTabs {...defaultProps} onViewChange={onViewChange} />);

      const statusTab = screen.getByRole('tab', { name: /status/i });
      await userEvent.click(statusTab);

      expect(onViewChange).toHaveBeenCalledWith('status');
    });

    it('should not call onViewChange for disabled tabs', async () => {
      const onViewChange = vi.fn();
      render(
        <EnhancedViewTabs {...defaultProps} onViewChange={onViewChange} disabledViews={['ai']} />
      );

      const aiTab = screen.getByRole('tab', { name: /ai/i });
      expect(aiTab).toBeDisabled();

      await userEvent.click(aiTab);
      expect(onViewChange).not.toHaveBeenCalled();
    });
  });

  describe('Badges', () => {
    it('should display NEW badge', () => {
      render(
        <EnhancedViewTabs
          {...defaultProps}
          badgeConfig={{
            ai: { type: 'new' },
          }}
        />
      );

      expect(screen.getByText('NEW')).toBeInTheDocument();
    });

    it('should display BETA badge', () => {
      render(
        <EnhancedViewTabs
          {...defaultProps}
          badgeConfig={{
            analytics: { type: 'beta' },
          }}
        />
      );

      expect(screen.getByText('BETA')).toBeInTheDocument();
    });

    it('should display count badge', () => {
      render(
        <EnhancedViewTabs
          {...defaultProps}
          badgeConfig={{
            'vulnerability-scanner': { type: 'count', value: 5 },
          }}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display warning badge', () => {
      render(
        <EnhancedViewTabs
          {...defaultProps}
          badgeConfig={{
            'circuit-breaker': { type: 'warning', value: 3 },
          }}
        />
      );

      expect(screen.getByText('WARNING')).toBeInTheDocument();
    });
  });

  describe('Visibility', () => {
    it('should hide specified views', () => {
      render(<EnhancedViewTabs {...defaultProps} hiddenViews={['ai', 'analytics']} />);

      expect(screen.queryByRole('tab', { name: /^ai$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /analytics/i })).not.toBeInTheDocument();
    });

    it('should disable specified views', () => {
      render(<EnhancedViewTabs {...defaultProps} disabledViews={['ai']} />);

      const aiTab = screen.getByRole('tab', { name: /ai/i });
      expect(aiTab).toBeDisabled();
    });
  });

  describe('Home Button', () => {
    it('should show home button when enabled', () => {
      render(<EnhancedViewTabs {...defaultProps} showHomeButton />);

      expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    });

    it('should not show home button when disabled', () => {
      render(<EnhancedViewTabs {...defaultProps} showHomeButton={false} />);

      expect(screen.queryByRole('button', { name: /home/i })).not.toBeInTheDocument();
    });

    it('should call onHomeClick when home button is clicked', async () => {
      const onHomeClick = vi.fn();
      render(<EnhancedViewTabs {...defaultProps} showHomeButton onHomeClick={onHomeClick} />);

      const homeButton = screen.getByRole('button', { name: /home/i });
      await userEvent.click(homeButton);

      expect(onHomeClick).toHaveBeenCalled();
    });
  });

  describe('Grouped Views', () => {
    it('should render category dividers', () => {
      const groupedViews = {
        Core: ['main', 'status', 'ai'] as ViewType[],
        Tools: ['analytics'] as ViewType[],
      };

      render(<EnhancedViewTabs {...defaultProps} groupedViews={groupedViews} />);

      expect(screen.getByText('Core')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on tablist', () => {
      render(<EnhancedViewTabs {...defaultProps} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-orientation', 'horizontal');
    });

    it('should have correct ARIA attributes on tabs', () => {
      render(<EnhancedViewTabs {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
        expect(tab).toHaveAttribute('aria-controls');
      });
    });

    it('should announce current view to screen readers', () => {
      render(<EnhancedViewTabs {...defaultProps} currentView="ai" />);

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/current view.*ai/i);
    });

    it('should have keyboard shortcut hints', () => {
      render(<EnhancedViewTabs {...defaultProps} />);

      const tabs = screen.getAllByRole('tab');
      const firstTab = tabs[0];

      // First tab should have "Press 1" hint
      expect(firstTab.textContent).toMatch(/1/);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard events', () => {
      const onViewChange = vi.fn();
      const { container } = render(
        <EnhancedViewTabs {...defaultProps} onViewChange={onViewChange} />
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();

      // Simulate arrow key press
      fireEvent.keyDown(nav!, { key: 'ArrowRight' });

      // Should have been called by navigation hook
      expect(onViewChange).toHaveBeenCalled();
    });
  });
});
