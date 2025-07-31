import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Archive, Settings, Upload, Activity, ChevronDown, MoreVertical, Download, Folder, Search, Filter, Zap, Moon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import UploadZone from "@/components/upload-zone";
import FileTree from "@/components/file-tree";
import CodeEditor from "@/components/code-editor";
import AnalysisPanel from "@/components/analysis-panel";
import { StatusDashboard } from "@/components/status-dashboard";
import { AIExplorationPanel } from "@/components/ai-exploration-panel";
import { EnhancedFileTree } from "@/components/enhanced-file-tree";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Archive as ArchiveType, File } from "@shared/schema";

export default function Home() {
  const [selectedArchive, setSelectedArchive] = useState<ArchiveType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openTabs, setOpenTabs] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fileTreeMode, setFileTreeMode] = useState<"classic" | "enhanced">("enhanced");

  // Apply dark mode to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const { data: archives = [], refetch: refetchArchives } = useQuery<ArchiveType[]>({
    queryKey: ["archives"],
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
    
    // Add to tabs if not already open
    if (!openTabs.find(tab => tab.id === file.id)) {
      setOpenTabs([...openTabs, file]);
    }
    setActiveTab(file.id);
  };

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

  if (showUpload || !archives?.length) {
    return (
      <div className="h-screen bg-background text-foreground dark">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 vscode-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Archive className="text-primary h-8 w-8 vscode-glow" />
                <h1 className="text-xl font-semibold quantum-text">ZipWizard</h1>
              </div>
              <Badge variant="secondary" className="text-xs quantum-gradient text-white">v2.2.6b</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="modern-button quantum-gradient text-white">
                <Upload className="w-4 h-4 mr-2" />
                Upload Archive
              </Button>
              
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="vscode-hover">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                    <Moon className="w-4 h-4 mr-2" />
                    Toggle Dark Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 vscode-slideIn">
          <UploadZone onUploadSuccess={handleArchiveUploaded} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col dark">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 vscode-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Archive className="text-primary h-8 w-8 vscode-glow" />
              <h1 className="text-xl font-semibold quantum-text">ZipWizard</h1>
            </div>
            <Badge variant="secondary" className="text-xs quantum-gradient text-white">v2.2.6b</Badge>
          </div>
          <div className="flex items-center space-x-4">
            {/* Archive Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="modern-button">
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Actions
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-64">
                <DropdownMenuLabel>Archive Management</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setShowUpload(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Archive
                  </DropdownMenuItem>
                  {selectedArchive && (
                    <DropdownMenuItem onClick={async () => {
                      const response = await fetch(`/api/v1/archives/${selectedArchive.id}/export`);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedArchive.name.replace('.zip', '')}-export.json`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Export Analysis
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setFileTreeMode(fileTreeMode === "classic" ? "enhanced" : "classic")}>
                    <Folder className="w-4 h-4 mr-2" />
                    Toggle View: {fileTreeMode === "classic" ? "Enhanced" : "Classic"}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
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
                <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                  <Moon className="w-4 h-4 mr-2" />
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Zap className="w-4 h-4 mr-2" />
                  Quantum Features
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden vscode-slideIn">
        {/* Sidebar */}
        <aside className="w-80 bg-muted/50 border-r border-border flex flex-col modern-scrollbar">
          {fileTreeMode === "enhanced" && selectedArchive ? (
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab Bar */}
          {openTabs.length > 0 && (
            <div className="bg-white border-b border-gray-200 px-4">
              <div className="flex space-x-1">
                {openTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSelect(tab)}
                    className={`px-4 py-3 text-sm font-medium flex items-center space-x-2 transition-colors ${
                      activeTab === tab.id
                        ? "text-gray-900 border-b-2 border-blue-600 bg-gray-50"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tab.name}</span>
                    <button
                      onClick={(e) => {
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
                      Use the file explorer on the left to browse {files.length} analyzed files
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
                    <TabsTrigger value="analysis" className="flex-1 vscode-hover">Analysis</TabsTrigger>
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
      </div>
    </div>
  );
}
