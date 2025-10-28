import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Palette,
  Monitor,
  FileText,
  Zap,
  Moon,
  Sun,
  Eye,
  Database,
} from 'lucide-react';

interface PreferencesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDarkMode: boolean;
  onDarkModeChange: (dark: boolean) => void;
  fileTreeMode: 'classic' | 'enhanced';
  onFileTreeModeChange: (mode: 'classic' | 'enhanced') => void;
}

interface PreferenceSettings {
  autoSave: boolean;
  showComplexity: boolean;
  showFileSize: boolean;
  maxRecentFiles: number;
  searchHighlight: boolean;
  enableAnimations: boolean;
  compactMode: boolean;
  monitoringEnabled: boolean;
  observerWindow: number;
}

export function PreferencesDialog({
  open,
  onOpenChange,
  isDarkMode,
  onDarkModeChange,
  fileTreeMode,
  onFileTreeModeChange,
}: PreferencesDialogProps) {
  const [settings, setSettings] = useState<PreferenceSettings>({
    autoSave: true,
    showComplexity: true,
    showFileSize: true,
    maxRecentFiles: 10,
    searchHighlight: true,
    enableAnimations: true,
    compactMode: false,
    monitoringEnabled: true,
    observerWindow: 48,
  });

  const updateSetting = <K extends keyof PreferenceSettings>(
    key: K,
    value: PreferenceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaults = () => {
    setSettings({
      autoSave: true,
      showComplexity: true,
      showFileSize: true,
      maxRecentFiles: 10,
      searchHighlight: true,
      enableAnimations: true,
      compactMode: false,
      monitoringEnabled: true,
      observerWindow: 48,
    });
    onDarkModeChange(false);
    onFileTreeModeChange('enhanced');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Preferences</span>
          </DialogTitle>
          <DialogDescription>
            Customize ZipWizard's appearance and behavior to match your workflow
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="appearance" className="flex items-center space-x-1">
              <Palette className="w-3 h-3" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="interface" className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Interface</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">Behavior</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-1">
              <Database className="w-3 h-3" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Palette className="w-4 h-4" />
                  <span>Theme & Colors</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Dark Mode</label>
                    <p className="text-xs text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4" />
                    <Switch checked={isDarkMode} onCheckedChange={onDarkModeChange} />
                    <Moon className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Compact Mode</label>
                    <p className="text-xs text-muted-foreground">Reduce spacing for more content</p>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={checked => updateSetting('compactMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Animations</label>
                    <p className="text-xs text-muted-foreground">
                      Enable smooth transitions and effects
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableAnimations}
                    onCheckedChange={checked => updateSetting('enableAnimations', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interface Tab */}
          <TabsContent value="interface" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>File Tree & Display</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">File Tree Mode</label>
                    <p className="text-xs text-muted-foreground">
                      Choose between classic and enhanced tree views
                    </p>
                  </div>
                  <Select value={fileTreeMode} onValueChange={onFileTreeModeChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                      <SelectItem value="classic">Classic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Show File Sizes</label>
                    <p className="text-xs text-muted-foreground">Display formatted file sizes</p>
                  </div>
                  <Switch
                    checked={settings.showFileSize}
                    onCheckedChange={checked => updateSetting('showFileSize', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Show Complexity Badges</label>
                    <p className="text-xs text-muted-foreground">
                      Display code complexity indicators
                    </p>
                  </div>
                  <Switch
                    checked={settings.showComplexity}
                    onCheckedChange={checked => updateSetting('showComplexity', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Recent Files Limit</label>
                      <p className="text-xs text-muted-foreground">
                        Maximum number of recent files to track
                      </p>
                    </div>
                    <Badge variant="outline">{settings.maxRecentFiles}</Badge>
                  </div>
                  <Slider
                    value={[settings.maxRecentFiles]}
                    onValueChange={([value]) => updateSetting('maxRecentFiles', value)}
                    min={5}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Application Behavior</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Auto-save Preferences</label>
                    <p className="text-xs text-muted-foreground">
                      Automatically save your settings
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoSave}
                    onCheckedChange={checked => updateSetting('autoSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Search Highlighting</label>
                    <p className="text-xs text-muted-foreground">
                      Highlight search terms in results
                    </p>
                  </div>
                  <Switch
                    checked={settings.searchHighlight}
                    onCheckedChange={checked => updateSetting('searchHighlight', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Observer & Monitoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Enable Monitoring</label>
                    <p className="text-xs text-muted-foreground">
                      Track file operations and system events
                    </p>
                  </div>
                  <Switch
                    checked={settings.monitoringEnabled}
                    onCheckedChange={checked => updateSetting('monitoringEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Monitoring Window</label>
                      <p className="text-xs text-muted-foreground">Hours to keep observer events</p>
                    </div>
                    <Badge variant="outline">{settings.observerWindow}h</Badge>
                  </div>
                  <Slider
                    value={[settings.observerWindow]}
                    onValueChange={([value]) => updateSetting('observerWindow', value)}
                    min={12}
                    max={168}
                    step={12}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
