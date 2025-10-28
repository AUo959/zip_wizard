/**
 * Search input for live filtering archive contents.
 * Should trigger search/filter/extract server- or worker-side for huge sets.
 */

import React, { useState } from "react";
import { Search, X, Filter, FileType } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export interface SearchFilters {
  fileTypes?: string[];
  dateRange?: { from: Date; to: Date };
  sizeRange?: { min: number; max: number };
  hasErrors?: boolean;
}

export interface ArchiveSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Search bar component for filtering archive contents.
 * Supports text search and advanced filtering.
 */
export const ArchiveSearchBar: React.FC<ArchiveSearchBarProps> = ({
  onSearch,
  onFilterChange,
  placeholder = "Search files...",
  className
}) => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const commonFileTypes = [
    "js", "ts", "jsx", "tsx",
    "py", "java", "cpp", "c",
    "html", "css", "json", "xml",
    "md", "txt", "pdf", "doc",
    "png", "jpg", "svg", "gif",
    "zip", "tar", "gz", "rar"
  ];

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    
    const newFilters = {
      ...filters,
      fileTypes: newTypes.length > 0 ? newTypes : undefined
    };
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const activeFilterCount = 
    (selectedTypes.length > 0 ? 1 : 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.sizeRange ? 1 : 0) +
    (filters.hasErrors ? 1 : 0);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={handleQueryChange}
            className="pl-9 pr-9"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[250px]">
            <DropdownMenuLabel>Filter by File Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {commonFileTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => handleTypeToggle(type)}
                >
                  <FileType className="h-3 w-3 mr-2" />
                  .{type}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active filters display */}
      {selectedTypes.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary" className="text-xs">
              .{type}
              <button
                onClick={() => handleTypeToggle(type)}
                className="ml-1 hover:bg-destructive/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArchiveSearchBar;
