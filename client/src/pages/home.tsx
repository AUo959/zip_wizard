import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Archive, Settings, Upload } from "lucide-react";
import UploadZone from "@/components/upload-zone";
import FileTree from "@/components/file-tree";
import CodeEditor from "@/components/code-editor";
import AnalysisPanel from "@/components/analysis-panel";
import type { Archive as ArchiveType, File } from "@shared/schema";

export default function Home() {
  const [selectedArchive, setSelectedArchive] = useState<ArchiveType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openTabs, setOpenTabs] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(true);

  const { data: archives, refetch: refetchArchives } = useQuery({
    queryKey: ["/api/archives"],
    enabled: !showUpload,
  });

  const { data: files } = useQuery({
    queryKey: ["/api/archives", selectedArchive?.id, "files"],
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
      <div className="h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Archive className="text-blue-600 h-8 w-8" />
                <h1 className="text-xl font-semibold text-gray-900">Zip Archive Wizard</h1>
              </div>
              <Badge variant="secondary" className="text-xs">v2.1.0</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Archive
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8">
          <UploadZone onUploadSuccess={handleArchiveUploaded} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Archive className="text-blue-600 h-8 w-8" />
              <h1 className="text-xl font-semibold text-gray-900">Zip Archive Wizard</h1>
            </div>
            <Badge variant="secondary" className="text-xs">v2.1.0</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Archive
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          <FileTree
            files={files || []}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            archive={selectedArchive}
            archives={archives || []}
            onArchiveSelect={setSelectedArchive}
          />
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
            <div className="flex-1 flex flex-col">
              {selectedFile ? (
                <CodeEditor file={selectedFile} />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Archive className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Select a file to view its contents</p>
                  </div>
                </div>
              )}
            </div>

            {/* Analysis Panel */}
            {selectedFile && (
              <div className="w-96 border-l border-gray-200">
                <AnalysisPanel file={selectedFile} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
