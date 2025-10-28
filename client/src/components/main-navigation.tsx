import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Archive,
  Settings,
  Moon,
  Sun,
  MoreVertical,
  Zap,
  BarChart3,
  Bot,
  FileSearch,
  Upload,
  Keyboard,
} from 'lucide-react';

interface MainNavigationProps {
  onSettingsClick: () => void;
  onShortcutsClick: () => void;
  onStatusDashboardClick: () => void;
  onAIExplorationClick: () => void;
  onAnalyticsClick: () => void;
  onUploadClick: () => void;
  isDarkMode: boolean;
  onDarkModeToggle: () => void;
  selectedArchive?: any;
  filesCount?: number;
}

export function MainNavigation({
  onSettingsClick,
  onShortcutsClick,
  onStatusDashboardClick,
  onAIExplorationClick,
  onAnalyticsClick,
  onUploadClick,
  isDarkMode,
  onDarkModeToggle,
  selectedArchive,
  filesCount = 0,
}: MainNavigationProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4 vscode-fadeIn">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Archive className="text-primary h-8 w-8 vscode-glow" />
            <h1 className="text-xl font-bold text-foreground">ZipWizard</h1>
          </div>
          <Badge
            variant="secondary"
            className="text-xs bg-primary text-primary-foreground font-semibold"
          >
            v2.2.6b
          </Badge>
          {selectedArchive && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>•</span>
              <span className="font-medium">{selectedArchive.name}</span>
              <Badge variant="outline" className="text-xs">
                {filesCount} files
              </Badge>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          <Button variant="ghost" size="sm" onClick={onUploadClick} className="text-xs">
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </Button>

          <Button variant="ghost" size="sm" onClick={onStatusDashboardClick} className="text-xs">
            <BarChart3 className="w-4 h-4 mr-1" />
            Status
          </Button>

          <Button variant="ghost" size="sm" onClick={onAIExplorationClick} className="text-xs">
            <Bot className="w-4 h-4 mr-1" />
            AI Tools
          </Button>

          <Button variant="ghost" size="sm" onClick={onShortcutsClick} className="text-xs">
            <Keyboard className="w-4 h-4 mr-1" />
            Help
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={onDarkModeToggle} className="vscode-hover">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="vscode-hover">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Application</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onSettingsClick}>
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onAnalyticsClick}>
                <FileSearch className="w-4 h-4 mr-2" />
                Analytics
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onShortcutsClick}>
                <Keyboard className="w-4 h-4 mr-2" />
                Keyboard Shortcuts
              </DropdownMenuItem>

              <DropdownMenuItem className="text-purple hover:text-white hover:bg-purple">
                <Zap className="w-4 h-4 mr-2" />
                Quantum Features
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
