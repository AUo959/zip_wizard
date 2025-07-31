import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, Share, Tag, X, Package, Activity, Clock } from "lucide-react";
import type { File } from "@shared/schema";

interface AnalysisPanelProps {
  file: File;
}

export default function AnalysisPanel({ file }: AnalysisPanelProps) {
  const getComplexityColor = (complexity: string | null) => {
    switch (complexity?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLanguageColor = (language: string | null) => {
    switch (language?.toLowerCase()) {
      case 'javascript':
      case 'react':
        return 'text-yellow-600 bg-yellow-50';
      case 'typescript':
      case 'react typescript':
        return 'text-blue-600 bg-blue-50';
      case 'python':
        return 'text-green-600 bg-green-50';
      case 'java':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-gray-50 flex flex-col h-full">
      {/* Panel Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Code Analysis</h3>
          <Button variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* AI Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">AI Description</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-700">{file.description}</p>
          </CardContent>
        </Card>

        {/* Language & Type */}
        {file.language && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900">Language</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Badge className={getLanguageColor(file.language)}>
                {file.language}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Dependencies */}
        {file.dependencies && file.dependencies.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Dependencies
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {file.dependencies.slice(0, 5).map((dep, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-mono">{dep}</span>
                  </div>
                ))}
                {file.dependencies.length > 5 && (
                  <p className="text-xs text-gray-500">
                    +{file.dependencies.length - 5} more dependencies
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Code Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded border text-center">
                <div className="font-medium text-gray-900">
                  {file.content?.split('\n').length || 0}
                </div>
                <div className="text-xs text-gray-500">Lines</div>
              </div>
              <div className="bg-white p-3 rounded border text-center">
                <Badge className={getComplexityColor(file.complexity)} variant="outline">
                  {file.complexity || 'Unknown'}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">Complexity</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              File Info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Size:</span>
              <span className="font-mono">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Extension:</span>
              <span className="font-mono">{file.extension || 'None'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Path:</span>
              <span className="font-mono text-xs truncate" title={file.path}>
                {file.path}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {file.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export File
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Share className="w-4 h-4 mr-2" />
              Share Analysis
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Tag className="w-4 h-4 mr-2" />
              Add Custom Tag
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
