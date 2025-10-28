import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize } from '@/lib/file-utils';
import { cn } from '@/lib/utils';
import type { File } from '@shared/schema';

interface CodeEditorProps {
  file: File;
}

export default function CodeEditor({ file }: CodeEditorProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      toast({
        title: 'Copied to clipboard',
        description: `Content of ${file.name} copied successfully`,
      });
    }
  };

  const getLanguageIcon = () => {
    const ext = file.extension?.toLowerCase();
    switch (ext) {
      case '.js':
      case '.jsx':
        return '🟨';
      case '.ts':
      case '.tsx':
        return '🟦';
      case '.py':
        return '🐍';
      case '.java':
        return '☕';
      case '.css':
        return '🎨';
      case '.html':
        return '🌐';
      default:
        return '📄';
    }
  };

  const highlightCode = (code: string, language: string) => {
    // Simple syntax highlighting
    return code
      .replace(
        /(import|export|const|let|var|function|class|if|else|for|while|return|try|catch)/g,
        '<span class="text-blue-600 font-medium">$1</span>'
      )
      .replace(/('[^']*'|"[^"]*")/g, '<span class="text-green-600">$1</span>')
      .replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, '<span class="text-gray-500 italic">$1</span>')
      .replace(/(\d+)/g, '<span class="text-orange-600">$1</span>');
  };

  if (!file.content && file.isDirectory !== 'true') {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-6xl mb-4">{getLanguageIcon()}</div>
          <p className="text-lg font-medium">Binary or empty file</p>
          <p className="text-sm">Cannot display content for this file type</p>
        </div>
      </div>
    );
  }

  const lines = file.content?.split('\n') || [];

  return (
    <div className="flex-1 flex flex-col">
      {/* File Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getLanguageIcon()}</span>
            <div>
              <h2 className="text-lg font-medium text-gray-900">{file.name}</h2>
              <p className="text-sm text-gray-500">
                {file.extension} • {file.language || 'Text'} • {formatFileSize(file.size)}
                {file.complexity && (
                  <>
                    {' • '}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs h-4 px-1 ml-1',
                        file.complexity === 'High' && 'border-red-500 text-red-600',
                        file.complexity === 'Medium' && 'border-yellow-500 text-yellow-600',
                        file.complexity === 'Low' && 'border-green-500 text-green-600'
                      )}
                    >
                      {file.complexity}
                    </Badge>
                  </>
                )}
              </p>
              {file.description && <p className="text-xs text-gray-400 mt-1">{file.description}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {file.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="flex">
          {/* Line Numbers */}
          <div className="code-editor bg-gray-50 text-gray-500 text-sm font-mono px-4 py-4 select-none border-r border-gray-200">
            {lines.map((_, index) => (
              <div key={index} className="text-right leading-6">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <div className="flex-1 font-mono text-sm p-4 overflow-auto leading-6">
            <pre>
              <code
                dangerouslySetInnerHTML={{
                  __html: file.language
                    ? highlightCode(file.content || '', file.language)
                    : file.content || '',
                }}
              />
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
