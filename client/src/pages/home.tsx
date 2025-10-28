import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Archive, Settings, Upload, Activity, ChevronDown, MoreVertical, Download, Folder, Search, Filter, Zap, Moon, Sun, BarChart3, Bot, Keyboard, FileText, Code, X, Eye, Copy, Clock, Layers } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import UploadZone from "@/components/upload-zone";
import FileTree from "@/components/file-tree";
import CodeEditor from "@/components/code-editor";
import AnalysisPanel from "@/components/analysis-panel";
import { StatusDashboard } from "@/components/status-dashboard";
import { AIExplorationPanel } from "@/components/ai-exploration-panel";
import { AnalyticsView } from "@/components/analytics-view";
import { AIToolsView } from "@/components/ai-tools-view";
import { SymbolicInterface } from "@/components/symbolic-interface";
import { EnhancedArchiveManager } from "@/components/enhanced-archive-manager";
import { ArchiveManager } from "@/components/ArchiveManager";
import { PrivacyShield } from "@/components/privacy-shield";
import { MultilingualSupport } from "@/components/multilingual-support";
import { FlowStateManager } from "@/components/flow-state-manager";
import { WuWeiInterface } from "@/components/wu-wei-interface";
import { MemoryCompression } from "@/components/memory-compression";
import { CognitiveLoadReducer } from "@/components/cognitive-load-reducer";
import { PatternRecognitionEngine } from "@/components/pattern-recognition-engine";
import { IncrementalProcessor } from "@/components/incremental-processor";
import { ArchiveComparison } from "@/components/archive-comparison";
import { VulnerabilityScanner } from "@/components/vulnerability-scanner";
import { DependencyGraph } from "@/components/dependency-graph";
import { CodeMetricsAnalyzer } from "@/components/code-metrics-analyzer";
import { TimingOptimizer } from "@/components/timing-optimizer";
import { CircuitBreakerMonitor } from "@/components/circuit-breaker-monitor";
import { EnhancedFileTree } from "@/components/enhanced-file-tree";
import { RecentFilesPanel } from "@/components/recent-files-panel";
import { EnhancedSearch } from "@/components/enhanced-search";
import { LoadingSpinner, FileTreeLoading, CodeEditorLoading } from "@/components/loading-states";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreadcrumbNavigation } from "@/components/breadcrumb-navigation";
import { ShortcutsDialog } from "@/components/shortcuts-dialog";
import { PreferencesDialog } from "@/components/preferences-dialog";
import { MainNavigation } from "@/components/main-navigation";
import { EnhancedViewTabs } from "@/components/enhanced-view-tabs";
import { useKeyboardShortcuts, defaultShortcuts, formatShortcut } from "@/hooks/use-keyboard-shortcuts";
import type { Archive as ArchiveType, File } from "@shared/schema";
import { type ViewType, ALL_VIEWS, VIEW_METADATA } from "@shared/views";

/**
 * Main application component for ZipWizard.
 * Manages view navigation and state across all application views.
 *
 * @see ViewType - Centralized view type definition
 * @see ALL_VIEWS - Complete list of available views
 */
export default function Home() {
  const [selectedArchive, setSelectedArchive] = useState<ArchiveType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openTabs, setOpenTabs] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fileTreeMode, setFileTreeMode] = useState<'classic' | 'enhanced'>('enhanced');
  const [recentFiles, setRecentFiles] = useState<File[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [dreamMode, setDreamMode] = useState(false);
  const [privacyShieldActive, setPrivacyShieldActive] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Badge state for enhanced navigation
  const [vulnerabilityCount, setVulnerabilityCount] = useState(0);
  const [circuitBreakerErrors, setCircuitBreakerErrors] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [isDarkMode]);

  // Badge configuration for enhanced navigation
  const badgeConfig = {
    ai: { type: 'new' as const },
    analytics: { type: 'beta' as const },
    'vulnerability-scanner':
      vulnerabilityCount > 0 ? { type: 'warning' as const, value: vulnerabilityCount } : undefined,
    'circuit-breaker':
      circuitBreakerErrors > 0
        ? { type: 'warning' as const, value: circuitBreakerErrors }
        : undefined,
    status:
      unreadNotifications > 0 ? { type: 'count' as const, value: unreadNotifications } : undefined,
  };

  // Grouped views for enhanced navigation
  const groupedViews = {
    Core: ['main', 'status', 'ai'] as ViewType[],
    Tools: ['analytics', 'archive-manager', 'archive-comparison'] as ViewType[],
    Security: ['vulnerability-scanner', 'privacy', 'circuit-breaker'] as ViewType[],
    Analysis: [
      'dependency-graph',
      'code-metrics',
      'pattern-recognition',
      'timing-optimizer',
      'incremental-processor',
    ] as ViewType[],
    Advanced: [
      'mushin',
      'wu-wei',
      'symbolic',
      'flow-manager',
      'cognitive-load',
      'memory-compression',
      'multilingual',
    ] as ViewType[],
  };

  const { data: archives = [], refetch: refetchArchives } = useQuery<ArchiveType[]>({
    queryKey: ['archives'],
    enabled: !showUpload,
  });

  // Auto-select first archive
  useEffect(() => {
    if (archives.length > 0 && !selectedArchive) {
      setSelectedArchive(archives[0]);
    }
  }, [archives, selectedArchive]);

  const { data: files = [] } = useQuery<File[]>({
    queryKey: [`archives/${selectedArchive?.id}/files`],
    enabled: !!selectedArchive,
  });

  const handleArchiveUploaded = () => {
    setShowUpload(false);
    refetchArchives();
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);

    // Add to recent files (keep last 10)
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.id !== file.id);
      return [file, ...filtered].slice(0, 10);
    });

    // Add to tabs if not already open
    if (!openTabs.find(tab => tab.id === file.id)) {
      setOpenTabs([...openTabs, file]);
    }
    setActiveTab(file.id);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...defaultShortcuts.SEARCH,
      action: () => document.getElementById('enhanced-search-input')?.focus(),
    },
    {
      ...defaultShortcuts.COPY,
      action: () => {
        if (selectedFile?.content) {
          navigator.clipboard.writeText(selectedFile.content);
        }
      },
    },
    {
      ...defaultShortcuts.CLOSE_TAB,
      action: () => {
        if (activeTab) handleTabClose(activeTab);
      },
    },
    {
      ...defaultShortcuts.TOGGLE_SIDEBAR,
      action: () => setSidebarCollapsed(!sidebarCollapsed),
    },
    {
      ...defaultShortcuts.HELP,
      action: () => setShowShortcuts(true),
    },
  ]);

  const handleTabClose = (fileId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== fileId);
    setOpenTabs(newTabs);

    if (activeTab === fileId) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
      setSelectedFile(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const handleTabSelect = (file: File) => {
    setActiveTab(file.id);
    setSelectedFile(file);
  };

  // Enhanced command handlers
  const handleSymbolicCommand = useCallback(
    (command: string, params?: any) => {
      console.log('Symbolic command executed:', command, params);
      switch (command) {
        case 'quantum-analysis':
          // Trigger quantum analysis with Aurora-inspired flow state
          console.log('Quantum analysis initiated with flow state:', params?.flowState);
          break;
        case 'initialize-thread':
          // Initialize symbolic thread with continuity anchor
          console.log('Thread initialized with anchor:', params?.anchor);
          break;
        case 'activate-wu-wei':
          // Switch to wu-wei interface for effortless interactions
          setCurrentView('wu-wei');
          break;
        case 'activate-mushin':
          // Switch to mushin state for no-mind processing
          setCurrentView('mushin');
          break;
        case 'toggle-compression':
          // Toggle memory compression for pattern recognition
          setCurrentView('memory-compression');
          break;
        case 'cognitive-load-analysis':
          // Switch to cognitive load reduction interface
          setCurrentView('cognitive-load');
          break;
        case 'pattern-recognition':
          // Switch to pattern recognition engine
          setCurrentView('pattern-recognition');
          break;
        case 'toggle-privacy':
          setPrivacyShieldActive(params?.enabled ?? !privacyShieldActive);
          break;
        default:
          console.log('Unknown symbolic command:', command);
      }
    },
    [privacyShieldActive]
  );

  const handleArchiveProcess = useCallback((archiveId: string, operation: string, params?: any) => {
    console.log('Archive operation:', operation, 'on archive:', archiveId, 'with params:', params);
  }, []);

  const handleBatchOperation = useCallback((archiveIds: string[], operation: string) => {
    console.log('Batch operation:', operation, 'on archives:', archiveIds);
  }, []);

  const handlePrivacySettingsChange = useCallback((settings: any) => {
    console.log('Privacy settings changed:', settings);
  }, []);

  const handleLanguageChange = useCallback((language: string) => {
    setCurrentLanguage(language);
    console.log('Language changed to:', language);
  }, []);

  /**
   * Helper function to check if a view is currently active.
   * Prevents TypeScript narrowing issues in switch statement default cases.
   *
   * @param view - The view to check against currentView
   * @returns True if the view is currently active
   * @see ViewType - For available view options
   */
  const isActiveView = useCallback((view: ViewType) => currentView === view, [currentView]);

  if (showUpload || !archives?.length) {
    return (
      <div className="h-screen bg-background text-foreground">
        <MainNavigation
          onSettingsClick={() => setShowPreferences(true)}
          onShortcutsClick={() => setShowShortcuts(true)}
          onStatusDashboardClick={() => setCurrentView('status')}
          onAIExplorationClick={() => setCurrentView('ai')}
          onAnalyticsClick={() => setCurrentView('analytics')}
          onUploadClick={() => setShowUpload(true)}
          isDarkMode={isDarkMode}
          onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
        />

        {/* Enhanced Navigation with Keyboard Shortcuts */}
        <EnhancedViewTabs
          currentView={currentView}
          onViewChange={setCurrentView}
          showHomeButton
          onHomeClick={() => setCurrentView('main')}
          badgeConfig={badgeConfig}
          groupedViews={groupedViews}
        />

        {/* Dialogs for Upload View */}
        <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
        <PreferencesDialog
          open={showPreferences}
          onOpenChange={setShowPreferences}
          isDarkMode={isDarkMode}
          onDarkModeChange={setIsDarkMode}
          fileTreeMode={fileTreeMode}
          onFileTreeModeChange={setFileTreeMode}
        />

        <div className="flex-1 p-8 vscode-slideIn">
          <UploadZone onUploadSuccess={handleArchiveUploaded} />
        </div>
      </div>
    );
  }

  /**
   * Renders the current view based on currentView state.
   * Uses exhaustive switch statement to ensure all views are handled.
   *
   * @returns JSX for the current view
   * @see ViewType - For complete list of available views
   * @see ALL_VIEWS - Source of truth for view definitions
   */
  const renderCurrentView = (): JSX.Element => {
    switch (currentView) {
      case 'status':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <StatusDashboard archiveId={selectedArchive?.id || ''} />
          </div>
        );

      case 'ai':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <AIToolsView
              files={
                files?.map(f => ({
                  id: f.id,
                  name: f.name,
                  content: f.content || '',
                  language: f.language || 'unknown',
                  complexity: f.complexity || 'medium',
                })) || []
              }
              selectedArchive={selectedArchive}
            />
          </div>
        );

      case 'analytics':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <AnalyticsView
              files={
                files?.map(f => ({
                  id: f.id,
                  name: f.name,
                  extension: f.extension || 'unknown',
                  language: f.language || 'unknown',
                  complexity: f.complexity || 'medium',
                  size: f.size,
                })) || []
              }
              selectedArchive={selectedArchive}
            />
          </div>
        );

      case 'symbolic':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <SymbolicInterface
                onCommandExecute={handleSymbolicCommand}
                dreamMode={dreamMode}
                onDreamModeToggle={() => setDreamMode(!dreamMode)}
              />
            </div>
          </div>
        );

      case "archive-manager":
        // Convert files to FileNode format for ArchiveManager
        // Create a map for efficient file lookup
        const fileMap = new Map(files?.map(f => [`${f.name}-${f.path}`, f]) || []);
        
        const fileNodes = files?.map(f => ({
          name: f.name,
          path: f.path,
          size: f.size,
          isDirectory: f.isDirectory === "true",
          modified: f.lastMutated || undefined,
          error: undefined,
          metadata: {
            language: f.language,
            extension: f.extension,
            complexity: f.complexity
          }
        })) || [];
        
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <ArchiveManager
              initialFiles={fileNodes}
              initialArchiveName={selectedArchive?.name || "Archive"}
              onFileSelect={(file) => {
                // Use map for O(1) lookup instead of find
                const matchedFile = fileMap.get(`${file.name}-${file.path}`);
                if (matchedFile) {
                  setSelectedFile(matchedFile);
                }
              }}
              enableCollaboration={true}
              enableUndo={true}
            />
          </div>
        );

      case 'privacy':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <PrivacyShield
                isActive={privacyShieldActive}
                onToggle={setPrivacyShieldActive}
                onSettingsChange={handlePrivacySettingsChange}
              />
            </div>
          </div>
        );

      case 'multilingual':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <MultilingualSupport
                onLanguageChange={handleLanguageChange}
                currentLanguage={currentLanguage}
              />
            </div>
          </div>
        );

      case 'flow-manager':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <FlowStateManager
                onStateChange={state => console.log('Flow state changed:', state)}
                currentActivity="Archive analysis and exploration"
              />
            </div>
          </div>
        );

      case 'wu-wei':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <WuWeiInterface
                onAction={(action, natural) =>
                  console.log('Wu Wei action:', action, 'Natural:', natural)
                }
                currentFlow={75}
              />
            </div>
          </div>
        );

      case 'memory-compression':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <MemoryCompression
                files={files}
                onCompressionApplied={result => console.log('Compression result:', result)}
              />
            </div>
          </div>
        );

      case 'cognitive-load':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <CognitiveLoadReducer
                onLoadChange={load => console.log('Cognitive load changed:', load)}
                currentView={currentView}
              />
            </div>
          </div>
        );

      case 'pattern-recognition':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <PatternRecognitionEngine
                files={files}
                onPatternsDetected={patterns => console.log('Patterns detected:', patterns)}
                onOrganizationSuggested={org => console.log('Organization suggested:', org)}
              />
            </div>
          </div>
        );

      case 'incremental-processor':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <IncrementalProcessor
                file={undefined} // Will be set when user uploads
                onProcessComplete={result => console.log('Processing complete:', result)}
                onChunkProcessed={chunk => console.log('Chunk processed:', chunk)}
              />
            </div>
          </div>
        );

      case 'archive-comparison':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <ArchiveComparison
                archive1={selectedArchive}
                archive2={undefined} // Will need a second archive selector
                files1={files}
                files2={[]}
                onSelectFile={(file, side) => console.log('File selected:', file, side)}
              />
            </div>
          </div>
        );

      case 'vulnerability-scanner':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <VulnerabilityScanner
                files={files}
                onVulnerabilityFound={vuln => console.log('Vulnerability found:', vuln)}
                onScanComplete={report => console.log('Scan complete:', report)}
              />
            </div>
          </div>
        );

      case 'dependency-graph':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <DependencyGraph
                files={files}
                onNodeClick={node => console.log('Node clicked:', node)}
                onAnalysisComplete={analysis => console.log('Analysis complete:', analysis)}
              />
            </div>
          </div>
        );

      case 'code-metrics':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <CodeMetricsAnalyzer
                files={files}
                onAnalysisComplete={metrics => console.log('Analysis complete:', metrics)}
                onFileAnalyzed={(file, metrics) => console.log('File analyzed:', file, metrics)}
              />
            </div>
          </div>
        );

      case 'timing-optimizer':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <TimingOptimizer
                onOptimizationApplied={config => console.log('Optimization applied:', config)}
                onTimeoutPrevented={operation => console.log('Timeout prevented:', operation)}
              />
            </div>
          </div>
        );

      case 'circuit-breaker':
        return (
          <div className="h-full bg-background">
            <MainNavigation
              onSettingsClick={() => setShowPreferences(true)}
              onShortcutsClick={() => setShowShortcuts(true)}
              onStatusDashboardClick={() => setCurrentView('status')}
              onAIExplorationClick={() => setCurrentView('ai')}
              onAnalyticsClick={() => setCurrentView('analytics')}
              onUploadClick={() => setShowUpload(true)}
              isDarkMode={isDarkMode}
              onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
              selectedArchive={selectedArchive}
              filesCount={files?.length}
            />
            <div className="flex items-center p-4 border-b">
              <Button variant="ghost" onClick={() => setCurrentView('main')} className="mr-4">
                ← Back to Files
              </Button>
            </div>
            <div className="p-6">
              <CircuitBreakerMonitor />
            </div>
          </div>
        );

      default:
        return (
          <div className="h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="bg-card border-b border-border px-6 py-4 vscode-fadeIn">
              <div className="flex items-center justify-between">
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
                </div>
                <div className="flex items-center space-x-4">
                  {/* Archive Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="modern-button border-border bg-card text-card-foreground hover:bg-accent/10"
                      >
                        <Archive className="w-4 h-4 mr-2 text-primary" />
                        Archive Actions
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-64">
                      <DropdownMenuLabel>Archive Management</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() => setShowUpload(true)}
                          className="text-primary hover:text-primary-foreground hover:bg-primary"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload New Archive
                        </DropdownMenuItem>
                        {selectedArchive && (
                          <DropdownMenuItem
                            onClick={async () => {
                              const response = await fetch(
                                `/api/v1/archives/${selectedArchive.id}/export`
                              );
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${selectedArchive.name.replace('.zip', '')}-export.json`;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            }}
                            className="text-secondary hover:text-secondary-foreground hover:bg-secondary"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export Analysis
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          onClick={() =>
                            setFileTreeMode(fileTreeMode === 'classic' ? 'enhanced' : 'classic')
                          }
                          className="text-accent hover:text-accent-foreground hover:bg-accent"
                        >
                          <Folder className="w-4 h-4 mr-2" />
                          Toggle View: {fileTreeMode === 'classic' ? 'Enhanced' : 'Classic'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-info hover:text-white hover:bg-info">
                          <Search className="w-4 h-4 mr-2" />
                          Advanced Search
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Settings Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="vscode-hover">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Application Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="text-warning hover:text-white hover:bg-warning"
                      >
                        <Moon className="w-4 h-4 mr-2" />
                        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowPreferences(true)}
                        className="text-purple hover:text-white hover:bg-purple"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Preferences
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-cyan hover:text-white hover:bg-cyan">
                        <Zap className="w-4 h-4 mr-2" />
                        Quantum Features
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            {/* Enhanced Navigation Tabs with Keyboard Shortcuts */}
            <EnhancedViewTabs
              currentView={currentView}
              onViewChange={setCurrentView}
              showHomeButton
              onHomeClick={() => setCurrentView('main')}
              badgeConfig={badgeConfig}
              groupedViews={groupedViews}
            />

            {/* Enhanced Navigation */}
            <div className="bg-muted/30 border-b border-border px-6 py-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={isActiveView('symbolic') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('symbolic')}
                  size="sm"
                  className="text-xs"
                >
                  ⚡ Symbolic Interface
                </Button>
                <Button
                  variant={isActiveView('archive-manager') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('archive-manager')}
                  size="sm"
                  className="text-xs"
                >
                  📦 Archive Manager
                </Button>
                <Button
                  variant={isActiveView('privacy') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('privacy')}
                  size="sm"
                  className="text-xs"
                >
                  🛡️ Privacy Shield
                </Button>
                <Button
                  variant={isActiveView('multilingual') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('multilingual')}
                  size="sm"
                  className="text-xs"
                >
                  🌍 Multilingual
                </Button>
                <Button
                  variant={isActiveView('flow-manager') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('flow-manager')}
                  size="sm"
                  className="text-xs"
                >
                  🧘 Flow States
                </Button>
                <Button
                  variant={isActiveView('wu-wei') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('wu-wei')}
                  size="sm"
                  className="text-xs"
                >
                  💫 Wu Wei
                </Button>
                <Button
                  variant={isActiveView('memory-compression') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('memory-compression')}
                  size="sm"
                  className="text-xs"
                >
                  🗜️ Compression
                </Button>
                <Button
                  variant={isActiveView('cognitive-load') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('cognitive-load')}
                  size="sm"
                  className="text-xs"
                >
                  🧠 Cognitive Load
                </Button>
                <Button
                  variant={isActiveView('pattern-recognition') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('pattern-recognition')}
                  size="sm"
                  className="text-xs"
                >
                  🔍 Patterns
                </Button>
                <Button
                  variant={isActiveView('incremental-processor') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('incremental-processor')}
                  size="sm"
                  className="text-xs"
                >
                  ⚡ Incremental
                </Button>
                <Button
                  variant={isActiveView('archive-comparison') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('archive-comparison')}
                  size="sm"
                  className="text-xs"
                >
                  🔄 Compare
                </Button>
                <Button
                  variant={isActiveView('vulnerability-scanner') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('vulnerability-scanner')}
                  size="sm"
                  className="text-xs"
                >
                  🛡️ Security
                </Button>
                <Button
                  variant={isActiveView('dependency-graph') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('dependency-graph')}
                  size="sm"
                  className="text-xs"
                >
                  🕸️ Graph
                </Button>
                <Button
                  variant={isActiveView('code-metrics') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('code-metrics')}
                  size="sm"
                  className="text-xs"
                >
                  📊 Metrics
                </Button>
                <Button
                  variant={isActiveView('timing-optimizer') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('timing-optimizer')}
                  size="sm"
                  className="text-xs"
                >
                  ⏱️ Timing
                </Button>
                <Button
                  variant={isActiveView('circuit-breaker') ? 'default' : 'outline'}
                  onClick={() => setCurrentView('circuit-breaker')}
                  size="sm"
                  className="text-xs"
                >
                  🛡️ Breakers
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden vscode-slideIn">
              {/* Sidebar */}
              <aside className="w-80 bg-muted/50 border-r border-border flex flex-col modern-scrollbar">
                {/* Header with breadcrumb */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Files</h3>
                    <Badge variant="outline" className="text-xs">
                      {files?.length || 0} files
                    </Badge>
                  </div>

                  {/* Breadcrumb Navigation */}
                  {selectedFile && (
                    <div className="mb-3">
                      <BreadcrumbNavigation
                        currentFile={selectedFile}
                        archiveName={selectedArchive?.name}
                        onNavigate={() => {}} // TODO: Implement folder navigation
                      />
                    </div>
                  )}
                </div>

                {/* Tabs for Files, Search, and Recent */}
                <div className="flex-1 overflow-hidden">
                  <Tabs defaultValue="files" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 mx-3 mt-2">
                      <TabsTrigger value="files" className="text-xs">
                        Files
                      </TabsTrigger>
                      <TabsTrigger value="search" className="text-xs">
                        Search
                      </TabsTrigger>
                      <TabsTrigger value="recent" className="text-xs">
                        Recent
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="files" className="flex-1 mt-2 overflow-hidden">
                      {fileTreeMode === 'enhanced' && selectedArchive ? (
                        <EnhancedFileTree
                          files={files || []}
                          selectedFile={selectedFile}
                          onFileSelect={handleFileSelect}
                          archive={selectedArchive}
                        />
                      ) : (
                        <FileTree
                          files={files || []}
                          selectedFile={selectedFile}
                          onFileSelect={handleFileSelect}
                          archive={selectedArchive}
                          archives={archives || []}
                          onArchiveSelect={setSelectedArchive}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="search" className="flex-1 mt-2 overflow-hidden px-3">
                      <EnhancedSearch
                        files={files || []}
                        selectedFile={selectedFile}
                        onFileSelect={handleFileSelect}
                      />
                    </TabsContent>

                    <TabsContent value="recent" className="flex-1 mt-2 overflow-hidden px-3">
                      <RecentFilesPanel
                        recentFiles={recentFiles}
                        selectedFile={selectedFile}
                        onFileSelect={handleFileSelect}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex-1 flex flex-col overflow-hidden">
                {/* Tab Bar */}
                {openTabs.length > 0 && (
                  <div className="bg-white border-b border-gray-200 px-4">
                    <div className="flex space-x-1">
                      {openTabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => handleTabSelect(tab)}
                          className={`px-4 py-3 text-sm font-medium flex items-center space-x-2 transition-colors ${
                            activeTab === tab.id
                              ? 'text-gray-900 border-b-2 border-blue-600 bg-gray-50'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <span>{tab.name}</span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleTabClose(tab.id);
                            }}
                            className="text-gray-400 hover:text-gray-900 ml-2"
                          >
                            ×
                          </button>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 flex overflow-hidden">
                  {/* Code Editor */}
                  <div className="flex-1 flex flex-col bg-background">
                    {selectedFile ? (
                      <CodeEditor file={selectedFile} />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground vscode-fadeIn">
                        <div className="text-center">
                          <Archive className="w-16 h-16 mx-auto mb-4 opacity-30 text-primary" />
                          <p className="text-lg">Select a file to view its contents</p>
                          <p className="text-sm mt-2 opacity-75">
                            Use the file explorer on the left to browse {files.length} analyzed
                            files
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis Panel */}
                  {selectedFile && (
                    <div className="w-96 border-l border-border bg-card modern-scrollbar">
                      <Tabs defaultValue="analysis" className="h-full">
                        <TabsList className="w-full rounded-none bg-muted">
                          <TabsTrigger value="analysis" className="flex-1 vscode-hover">
                            Analysis
                          </TabsTrigger>
                          <TabsTrigger value="status" className="flex-1 vscode-hover">
                            <Activity className="w-4 h-4 mr-2" />
                            Status
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="analysis" className="mt-0">
                          <AnalysisPanel file={selectedFile} />
                        </TabsContent>
                        <TabsContent value="status" className="mt-0 p-4 overflow-y-auto">
                          {selectedArchive && <StatusDashboard archiveId={selectedArchive.id} />}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}

                  {/* AI Exploration Panel */}
                  {selectedArchive && (
                    <AIExplorationPanel
                      archive={selectedArchive}
                      files={files}
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                    />
                  )}
                </div>
              </main>

              {/* Dialogs */}
              <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
              <PreferencesDialog
                open={showPreferences}
                onOpenChange={setShowPreferences}
                isDarkMode={isDarkMode}
                onDarkModeChange={setIsDarkMode}
                fileTreeMode={fileTreeMode}
                onFileTreeModeChange={setFileTreeMode}
              />
            </div>
          </div>
        );
    }
  };

  return renderCurrentView();
}
