import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Network,
  Layers,
  GitBranch,
  FileType,
  Folder,
  Zap,
  Eye,
  Target,
} from 'lucide-react';

interface PatternRecognitionEngineProps {
  files?: any[];
  onPatternsDetected?: (patterns: Pattern[]) => void;
  onOrganizationSuggested?: (organization: OrganizationSuggestion) => void;
}

interface Pattern {
  type: 'structural' | 'semantic' | 'behavioral' | 'temporal';
  name: string;
  confidence: number;
  occurrences: number;
  description: string;
  files: string[];
  optimization_potential: number;
}

interface OrganizationSuggestion {
  type: 'hierarchical' | 'functional' | 'domain' | 'temporal';
  confidence: number;
  structure: any;
  benefits: string[];
  cognitive_load_reduction: number;
}

export function PatternRecognitionEngine({
  files = [],
  onPatternsDetected,
  onOrganizationSuggested,
}: PatternRecognitionEngineProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [detectedPatterns, setDetectedPatterns] = useState<Pattern[]>([]);
  const [organizationSuggestions, setOrganizationSuggestions] = useState<OrganizationSuggestion[]>(
    []
  );
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  const analyzePatterns = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate pattern analysis with Aurora-inspired techniques
    const analysisSteps = [
      'Scanning file structures...',
      'Identifying semantic clusters...',
      'Analyzing behavioral patterns...',
      'Detecting temporal relationships...',
      'Generating organization suggestions...',
    ];

    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress((i + 1) * 20);
    }

    // Generate mock patterns based on Aurora research principles
    const patterns: Pattern[] = [
      {
        type: 'structural',
        name: 'Component Hierarchy',
        confidence: 94,
        occurrences: Math.floor(files.length * 0.3),
        description: 'Related components following consistent naming and organization patterns',
        files: files.slice(0, Math.floor(files.length * 0.3)).map(f => f.name || f.path || 'file'),
        optimization_potential: 85,
      },
      {
        type: 'semantic',
        name: 'Domain Clustering',
        confidence: 89,
        occurrences: Math.floor(files.length * 0.4),
        description: 'Files sharing semantic context and business logic relationships',
        files: files.slice(0, Math.floor(files.length * 0.4)).map(f => f.name || f.path || 'file'),
        optimization_potential: 92,
      },
      {
        type: 'behavioral',
        name: 'Access Patterns',
        confidence: 76,
        occurrences: Math.floor(files.length * 0.25),
        description: 'Files frequently accessed together, suggesting workflow relationships',
        files: files.slice(0, Math.floor(files.length * 0.25)).map(f => f.name || f.path || 'file'),
        optimization_potential: 78,
      },
      {
        type: 'temporal',
        name: 'Modification Clusters',
        confidence: 82,
        occurrences: Math.floor(files.length * 0.2),
        description: 'Files modified in temporal proximity, indicating collaborative development',
        files: files.slice(0, Math.floor(files.length * 0.2)).map(f => f.name || f.path || 'file'),
        optimization_potential: 71,
      },
    ];

    const suggestions: OrganizationSuggestion[] = [
      {
        type: 'hierarchical',
        confidence: 91,
        structure: {
          'Core Components': patterns[0].files.slice(0, 5),
          'Business Logic': patterns[1].files.slice(0, 4),
          Utilities: patterns[2].files.slice(0, 3),
        },
        benefits: [
          'Reduce cognitive load by 35%',
          'Improve discoverability',
          'Enable wu wei navigation patterns',
        ],
        cognitive_load_reduction: 35,
      },
      {
        type: 'functional',
        confidence: 87,
        structure: {
          'Data Layer': patterns[1].files.slice(0, 4),
          'Interface Layer': patterns[0].files.slice(0, 6),
          'Service Layer': patterns[2].files.slice(0, 3),
        },
        benefits: [
          'Align with mental models',
          'Support flow state maintenance',
          'Enable mushin-like spontaneous navigation',
        ],
        cognitive_load_reduction: 42,
      },
    ];

    setDetectedPatterns(patterns);
    setOrganizationSuggestions(suggestions);
    setIsAnalyzing(false);

    onPatternsDetected?.(patterns);
    if (suggestions.length > 0) {
      onOrganizationSuggested?.(suggestions[0]);
    }
  }, [files, onPatternsDetected, onOrganizationSuggested]);

  const getPatternIcon = (type: Pattern['type']) => {
    const icons = {
      structural: <Layers className="w-4 h-4" />,
      semantic: <Network className="w-4 h-4" />,
      behavioral: <Eye className="w-4 h-4" />,
      temporal: <GitBranch className="w-4 h-4" />,
    };
    return icons[type];
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 80) return 'text-blue-600 bg-blue-50';
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            Pattern Recognition Engine
            <Badge variant="outline" className="ml-auto">
              Aurora Cognitive AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">{files.length}</span> files ready for analysis
              </div>
              <Button
                onClick={analyzePatterns}
                disabled={isAnalyzing || files.length === 0}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Detect Patterns
                  </>
                )}
              </Button>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={analysisProgress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  Applying Aurora-inspired pattern recognition...
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {detectedPatterns.length > 0 && (
        <Tabs defaultValue="patterns" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="patterns">Detected Patterns</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detectedPatterns.map((pattern, index) => (
                <Card
                  key={pattern.name}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedPattern?.name === pattern.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                        {getPatternIcon(pattern.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm">{pattern.name}</h4>
                          <Badge className={`text-xs ${getConfidenceColor(pattern.confidence)}`}>
                            {pattern.confidence}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{pattern.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span>{pattern.occurrences} occurrences</span>
                          <Badge variant="secondary" className="text-xs">
                            {pattern.optimization_potential}% optimization
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedPattern && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {getPatternIcon(selectedPattern.type)}
                    {selectedPattern.name} - Detailed View
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {selectedPattern.confidence}%
                        </div>
                        <div className="text-xs text-muted-foreground">Confidence</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {selectedPattern.occurrences}
                        </div>
                        <div className="text-xs text-muted-foreground">Occurrences</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {selectedPattern.optimization_potential}%
                        </div>
                        <div className="text-xs text-muted-foreground">Optimization</div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Affected Files</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {selectedPattern.files.map((file, index) => (
                          <div
                            key={index}
                            className="text-xs p-2 bg-muted/30 rounded flex items-center gap-2"
                          >
                            <FileType className="w-3 h-3" />
                            {file}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="organization" className="space-y-4">
            {organizationSuggestions.map((suggestion, index) => (
              <Card key={suggestion.type}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}{' '}
                      Organization
                    </div>
                    <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence)}`}>
                      {suggestion.confidence}% confidence
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Cognitive Load Reduction: {suggestion.cognitive_load_reduction}%
                        </span>
                      </div>
                      <div className="space-y-1">
                        {suggestion.benefits.map((benefit, i) => (
                          <div key={i} className="text-xs text-green-700 flex items-center gap-1">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Suggested Structure</h5>
                      <div className="space-y-2">
                        {Object.entries(suggestion.structure).map(([category, files]) => (
                          <div key={category} className="p-3 bg-muted/30 rounded-lg">
                            <div className="font-medium text-sm mb-2 flex items-center gap-2">
                              <Folder className="w-3 h-3" />
                              {category}
                            </div>
                            <div className="space-y-1">
                              {(files as string[]).map((file, i) => (
                                <div key={i} className="text-xs text-muted-foreground ml-5">
                                  {file}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => onOrganizationSuggested?.(suggestion)}
                    >
                      Apply Organization
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
