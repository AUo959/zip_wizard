import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Keyboard, Search, Copy, X, ToggleLeft } from 'lucide-react';
import { formatShortcut } from '@/hooks/use-keyboard-shortcuts';

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  {
    category: 'Navigation',
    icon: ToggleLeft,
    items: [
      { key: 'Ctrl + B', description: 'Toggle sidebar' },
      { key: 'Ctrl + Tab', description: 'Next tab' },
      { key: 'Ctrl + Shift + Tab', description: 'Previous tab' },
      { key: 'Ctrl + W', description: 'Close current tab' },
    ],
  },
  {
    category: 'Search & Selection',
    icon: Search,
    items: [
      { key: 'Ctrl + F', description: 'Focus search' },
      { key: 'Enter', description: 'Select highlighted file' },
      { key: 'Escape', description: 'Clear search/close dialogs' },
    ],
  },
  {
    category: 'File Operations',
    icon: Copy,
    items: [
      { key: 'Ctrl + C', description: 'Copy file content' },
      { key: 'Ctrl + S', description: 'Save/Export file' },
      { key: 'Ctrl + D', description: 'Download file' },
    ],
  },
  {
    category: 'Interface',
    icon: Keyboard,
    items: [
      { key: '?', description: 'Show this help' },
      { key: 'Ctrl + ,', description: 'Open settings' },
      { key: 'F11', description: 'Toggle fullscreen' },
    ],
  },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and control ZipWizard efficiently
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {shortcuts.map(category => {
            const Icon = category.icon;
            return (
              <Card key={category.category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{category.category}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {category.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.description}</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {item.key}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Press{' '}
            <Badge variant="outline" className="text-xs">
              ?
            </Badge>{' '}
            anytime to show this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
