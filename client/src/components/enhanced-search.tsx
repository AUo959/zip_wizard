import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  X, 
  File as FileIcon,
  Folder,
  ArrowRight 
} from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import type { File } from "@shared/schema";

interface EnhancedSearchProps {
  files: File[];
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

interface SearchFilters {
  language?: string;
  complexity?: string;
  extension?: string;
}

export function EnhancedSearch({ files, onFileSelect, selectedFile }: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const languages = new Set<string>();
    const complexities = new Set<string>();
    const extensions = new Set<string>();

    files.forEach(file => {
      if (file.language) languages.add(file.language);
      if (file.complexity) complexities.add(file.complexity);
      if (file.extension) extensions.add(file.extension);
    });

    return {
      languages: Array.from(languages).sort(),
      complexities: Array.from(complexities).sort(),
      extensions: Array.from(extensions).sort()
    };
  }, [files]);

  // Advanced search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      return [];
    }

    return files.filter(file => {
      // Text search
      const matchesSearch = !searchQuery.trim() || 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter matching
      const matchesLanguage = !filters.language || file.language === filters.language;
      const matchesComplexity = !filters.complexity || file.complexity === filters.complexity;
      const matchesExtension = !filters.extension || file.extension === filters.extension;

      return matchesSearch && matchesLanguage && matchesComplexity && matchesExtension;
    });
  }, [files, searchQuery, filters]);

  // Keyboard shortcut for focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('enhanced-search-input')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  const hasActiveFilters = searchQuery.trim() || Object.keys(filters).length > 0;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Enhanced Search</span>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {searchResults.length} results
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="enhanced-search-input"
            placeholder="Search files, content, tags... (Ctrl+F)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-3 gap-2">
            <Select value={filters.language || ""} onValueChange={(value) => 
              setFilters(prev => value ? {...prev, language: value} : ({...prev, language: undefined}))
            }>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Languages</SelectItem>
                {filterOptions.languages.map(lang => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.complexity || ""} onValueChange={(value) => 
              setFilters(prev => value ? {...prev, complexity: value} : ({...prev, complexity: undefined}))
            }>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                {filterOptions.complexities.map(complexity => (
                  <SelectItem key={complexity} value={complexity}>{complexity}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.extension || ""} onValueChange={(value) => 
              setFilters(prev => value ? {...prev, extension: value} : ({...prev, extension: undefined}))
            }>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Extension" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {filterOptions.extensions.map(ext => (
                  <SelectItem key={ext} value={ext}>{ext}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search Results */}
        {hasActiveFilters && (
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No files match your search</p>
              </div>
            ) : (
              searchResults.map(file => {
                const isSelected = selectedFile?.id === file.id;
                const isDirectory = file.isDirectory === "true";
                
                return (
                  <Button
                    key={file.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start h-auto p-2 text-left",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => onFileSelect(file)}
                  >
                    <div className="flex items-start space-x-2 w-full min-w-0">
                      {isDirectory ? (
                        <Folder className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      ) : (
                        <FileIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">
                            {file.name}
                          </span>
                          <div className="flex items-center space-x-1 ml-2">
                            {!isDirectory && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)}
                              </span>
                            )}
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground truncate">
                            {file.path}
                          </span>
                          <div className="flex items-center space-x-1">
                            {file.language && (
                              <Badge variant="outline" className="text-xs h-4 px-1">
                                {file.language}
                              </Badge>
                            )}
                            {file.complexity && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs h-4 px-1",
                                  file.complexity === 'High' && "border-red-500 text-red-600",
                                  file.complexity === 'Medium' && "border-yellow-500 text-yellow-600",
                                  file.complexity === 'Low' && "border-green-500 text-green-600"
                                )}
                              >
                                {file.complexity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}