import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const matchesMeta = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
        const matchesShift = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const matchesAlt = shortcut.altKey === undefined || event.altKey === shortcut.altKey;

        if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
          event.preventDefault();
          event.stopPropagation();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Predefined shortcuts for ZipWizard
export const defaultShortcuts = {
  SEARCH: { key: 'f', ctrlKey: true, description: 'Focus search' },
  COPY: { key: 'c', ctrlKey: true, description: 'Copy file content' },
  CLOSE_TAB: { key: 'w', ctrlKey: true, description: 'Close current tab' },
  NEXT_TAB: { key: 'Tab', ctrlKey: true, description: 'Next tab' },
  PREV_TAB: { key: 'Tab', ctrlKey: true, shiftKey: true, description: 'Previous tab' },
  TOGGLE_SIDEBAR: { key: 'b', ctrlKey: true, description: 'Toggle sidebar' },
  HELP: { key: '?', description: 'Show shortcuts' },
};

export function formatShortcut(shortcut: Partial<KeyboardShortcut>): string {
  const parts = [];
  
  if (shortcut.ctrlKey || shortcut.metaKey) {
    parts.push('Ctrl');
  }
  if (shortcut.shiftKey) {
    parts.push('Shift');
  }
  if (shortcut.altKey) {
    parts.push('Alt');
  }
  
  parts.push(shortcut.key?.toUpperCase() || '');
  
  return parts.join(' + ');
}