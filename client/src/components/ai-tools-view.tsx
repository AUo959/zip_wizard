import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bot, Brain, FileSearch, Zap, Sparkles, Code, AlertCircle } from "lucide-react";

interface AIToolsViewProps {
  files?: Array<{
    id: string;
    name: string;
    content: string;
    language: string;
    complexity: string;
  }>;
  selectedArchive?: any;
}

export function AIToolsView({ files = [], selectedArchive }: AIToolsViewProps) {
  const totalFiles = files.length;
  const codeFiles = files.filter(f => f.language !== 'unknown').length;

  const aiFeatures = [
    {
      title: "Code Analysis",
      description: "Deep analysis of code patterns, quality, and potential improvements",
      icon: Code,
      status: "active",
      action: "Analyze Codebase"
    },
    {
      title: "Smart Search",
      description: "AI-powered semantic search across your entire codebase",
      icon: FileSearch,
      status: "active", 
      action: "Enable Smart Search"
    },
    {
      title: "Code Suggestions",
      description: "Get intelligent suggestions for code improvements and refactoring",
      icon: Brain,
      status: "requires-api",
      action: "Configure AI"
    },
    {
      title: "Documentation Generator",
      description: "Automatically generate documentation from your code",
      icon: Sparkles,
      status: "requires-api",
      action: "Generate Docs"
    },
    {
      title: "Quantum Processing",
      description: "Advanced quantum-inspired analysis for complex codebases",
      icon: Zap,
      status: "experimental",
      action: "Enable Quantum"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white">Active</Badge>;
      case 'requires-api':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Needs API Key</Badge>;
      case 'experimental':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Experimental</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Bot className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">AI Tools</h2>
        {selectedArchive && (
          <Badge variant="outline">{selectedArchive.name}</Badge>
        )}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-sm text-muted-foreground">Total files for analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Code Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{codeFiles}</div>
            <p className="text-sm text-muted-foreground">Files with detectable code</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">AI Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles > 0 ? Math.round((codeFiles / totalFiles) * 100) : 0}%</div>
            <p className="text-sm text-muted-foreground">Files ready for AI analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* API Key Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Some AI features require an API key. Configure your API keys in the settings to unlock advanced capabilities.
        </AlertDescription>
      </Alert>

      {/* AI Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <span>{feature.title}</span>
                  </div>
                  {getStatusBadge(feature.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                <Button 
                  variant={feature.status === 'active' ? 'default' : 'outline'}
                  className="w-full"
                  disabled={feature.status === 'requires-api'}
                >
                  {feature.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start">
            <FileSearch className="w-4 h-4 mr-2" />
            Run semantic search across all files
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Code className="w-4 h-4 mr-2" />
            Generate code quality report
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Sparkles className="w-4 h-4 mr-2" />
            Create project documentation
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Zap className="w-4 h-4 mr-2" />
            Activate quantum analysis mode
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}