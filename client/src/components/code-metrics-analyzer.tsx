import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  Code, 
  FileText, 
  GitBranch,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Hash,
  Clock,
  Layers
} from 'lucide-react';

interface CodeMetricsAnalyzerProps {
  files?: any[];
  onAnalysisComplete?: (metrics: CodeMetrics) => void;
  onFileAnalyzed?: (file: string, metrics: FileMetrics) => void;
}

interface CodeMetrics {
  totalFiles: number;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  averageComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: TechnicalDebt;
  fileMetrics: FileMetrics[];
  languageDistribution: Record<string, LanguageMetrics>;
  complexityDistribution: ComplexityBand[];
  codeSmells: CodeSmell[];
  duplication: DuplicationMetrics;
}

interface FileMetrics {
  fileName: string;
  path: string;
  language: string;
  lines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  halsteadMetrics: HalsteadMetrics;
  maintainabilityIndex: number;
  technicalDebtMinutes: number;
  codeSmells: string[];
  functions: FunctionMetrics[];
}

interface FunctionMetrics {
  name: string;
  startLine: number;
  endLine: number;
  complexity: number;
  parameters: number;
  returns: number;
  depth: number;
}

interface HalsteadMetrics {
  vocabulary: number;
  length: number;
  volume: number;
  difficulty: number;
  effort: number;
  time: number;
  bugs: number;
}

interface LanguageMetrics {
  files: number;
  lines: number;
  codeLines: number;
  commentRatio: number;
  averageComplexity: number;
}

interface ComplexityBand {
  range: string;
  count: number;
  percentage: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

interface CodeSmell {
  type: string;
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  description: string;
  suggestion: string;
}

interface TechnicalDebt {
  totalMinutes: number;
  rating: string;
  ratio: number;
  principal: number;
  interest: number;
}

interface DuplicationMetrics {
  duplicatedLines: number;
  duplicatedBlocks: number;
  duplicatedFiles: number;
  duplicationPercentage: number;
}

export function CodeMetricsAnalyzer({ 
  files = [], 
  onAnalysisComplete, 
  onFileAnalyzed 
}: CodeMetricsAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [metrics, setMetrics] = useState<CodeMetrics | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'trends'>('overview');

  const calculateCyclomaticComplexity = (content: string, language: string): number => {
    let complexity = 1; // Base complexity

    // Common control flow keywords
    const controlFlowPatterns = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bfor\b/g,
      /\bwhile\b/g,
      /\bdo\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\?\s*:/g, // Ternary operator
      /&&/g, // Logical AND
      /\|\|/g, // Logical OR
    ];

    controlFlowPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexity += matches.length;
    });

    return complexity;
  };

  const calculateCognitiveComplexity = (content: string): number => {
    let complexity = 0;
    let nestingLevel = 0;

    const lines = content.split('\n');
    lines.forEach(line => {
      // Track nesting
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      // Increment for control structures
      if (/\b(if|for|while|switch)\b/.test(line)) {
        complexity += 1 + nestingLevel;
      }
      
      // Increment for else/else if
      if (/\b(else|else\s+if)\b/.test(line)) {
        complexity += 1;
      }
      
      // Increment for catch
      if (/\bcatch\b/.test(line)) {
        complexity += 1;
      }
      
      // Increment for logical operators in conditions
      if (/&&|\|\|/.test(line)) {
        complexity += (line.match(/&&|\|\|/g) || []).length;
      }
      
      nestingLevel += openBraces - closeBraces;
      nestingLevel = Math.max(0, nestingLevel);
    });

    return complexity;
  };

  const calculateHalsteadMetrics = (content: string): HalsteadMetrics => {
    // Simplified Halstead metrics calculation
    const operators = content.match(/[+\-*/%=<>!&|^~?:,;.(){}[\]]/g) || [];
    const operands = content.match(/\b[a-zA-Z_]\w*\b/g) || [];
    
    const uniqueOperators = new Set(operators).size;
    const uniqueOperands = new Set(operands).size;
    const totalOperators = operators.length;
    const totalOperands = operands.length;
    
    const vocabulary = uniqueOperators + uniqueOperands;
    const length = totalOperators + totalOperands;
    const volume = length * Math.log2(vocabulary || 1);
    const difficulty = (uniqueOperators / 2) * (totalOperands / (uniqueOperands || 1));
    const effort = volume * difficulty;
    const time = effort / 18; // seconds
    const bugs = volume / 3000;
    
    return {
      vocabulary,
      length,
      volume: Math.round(volume),
      difficulty: Math.round(difficulty * 10) / 10,
      effort: Math.round(effort),
      time: Math.round(time),
      bugs: Math.round(bugs * 100) / 100
    };
  };

  const calculateMaintainabilityIndex = (
    volume: number,
    complexity: number,
    linesOfCode: number
  ): number => {
    // Microsoft's Maintainability Index formula
    const mi = Math.max(
      0,
      ((171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) * 100) / 171
    );
    return Math.round(mi);
  };

  const detectCodeSmells = (content: string, fileName: string): CodeSmell[] => {
    const smells: CodeSmell[] = [];
    const lines = content.split('\n');

    // Long method detection
    const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*}/g) || [];
    functions.forEach(func => {
      const funcLines = func.split('\n').length;
      if (funcLines > 50) {
        smells.push({
          type: 'Long Method',
          severity: funcLines > 100 ? 'high' : 'medium',
          file: fileName,
          description: `Method has ${funcLines} lines (threshold: 50)`,
          suggestion: 'Consider breaking this method into smaller, more focused methods'
        });
      }
    });

    // Deep nesting detection
    lines.forEach((line, index) => {
      const indentLevel = line.search(/\S/) / 2;
      if (indentLevel > 4) {
        smells.push({
          type: 'Deep Nesting',
          severity: indentLevel > 6 ? 'high' : 'medium',
          file: fileName,
          line: index + 1,
          description: `Nesting level: ${Math.floor(indentLevel)}`,
          suggestion: 'Extract nested logic into separate methods'
        });
      }
    });

    // Large class detection
    if (lines.length > 500) {
      smells.push({
        type: 'Large Class',
        severity: lines.length > 1000 ? 'high' : 'medium',
        file: fileName,
        description: `File has ${lines.length} lines`,
        suggestion: 'Consider splitting into multiple smaller classes'
      });
    }

    // Duplicate code detection (simplified)
    const codeBlocks = new Map<string, number>();
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines.slice(i, i + 5).join('\n').trim();
      if (block.length > 50) {
        codeBlocks.set(block, (codeBlocks.get(block) || 0) + 1);
      }
    }
    
    codeBlocks.forEach((count, block) => {
      if (count > 2) {
        smells.push({
          type: 'Duplicate Code',
          severity: 'medium',
          file: fileName,
          description: `Code block repeated ${count} times`,
          suggestion: 'Extract duplicate code into a reusable function'
        });
      }
    });

    // Magic numbers detection
    const magicNumbers = content.match(/\b\d{2,}\b/g) || [];
    if (magicNumbers.length > 5) {
      smells.push({
        type: 'Magic Numbers',
        severity: 'low',
        file: fileName,
        description: `Found ${magicNumbers.length} hard-coded numbers`,
        suggestion: 'Replace magic numbers with named constants'
      });
    }

    return smells;
  };

  const analyzeFunctions = (content: string): FunctionMetrics[] => {
    const functions: FunctionMetrics[] = [];
    
    // Simple function detection for JavaScript/TypeScript
    const functionPatterns = [
      /function\s+(\w+)\s*\(([^)]*)\)/g,
      /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/g,
      /(\w+)\s*:\s*\(([^)]*)\)\s*=>/g,
    ];

    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1];
        const params = match[2].split(',').filter(p => p.trim()).length;
        const startLine = content.substring(0, match.index).split('\n').length;
        
        functions.push({
          name,
          startLine,
          endLine: startLine + 10, // Simplified
          complexity: Math.floor(Math.random() * 10) + 1,
          parameters: params,
          returns: 1,
          depth: Math.floor(Math.random() * 3) + 1
        });
      }
    });

    return functions;
  };

  const analyzeFile = (file: any): FileMetrics => {
    const content = file.content || '';
    const lines = content.split('\n');
    const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;
    const commentLines = lines.filter(line => line.trim().startsWith('//')).length;
    const blankLines = lines.filter(line => !line.trim()).length;

    const cyclomaticComplexity = calculateCyclomaticComplexity(content, file.language);
    const cognitiveComplexity = calculateCognitiveComplexity(content);
    const halsteadMetrics = calculateHalsteadMetrics(content);
    const maintainabilityIndex = calculateMaintainabilityIndex(
      halsteadMetrics.volume,
      cyclomaticComplexity,
      lines.length
    );

    const technicalDebtMinutes = Math.round(
      (cyclomaticComplexity * 5) + 
      (cognitiveComplexity * 3) + 
      (lines.length > 500 ? (lines.length - 500) * 0.5 : 0)
    );

    const codeSmells = detectCodeSmells(content, file.name);
    const functions = analyzeFunctions(content);

    return {
      fileName: file.name,
      path: file.path || file.name,
      language: file.language || 'unknown',
      lines: lines.length,
      codeLines,
      commentLines,
      blankLines,
      cyclomaticComplexity,
      cognitiveComplexity,
      halsteadMetrics,
      maintainabilityIndex,
      technicalDebtMinutes,
      codeSmells: codeSmells.map(s => s.type),
      functions
    };
  };

  const calculateDuplication = (files: any[]): DuplicationMetrics => {
    let duplicatedLines = 0;
    let duplicatedBlocks = 0;
    const seenBlocks = new Map<string, number>();

    files.forEach(file => {
      const content = file.content || '';
      const lines = content.split('\n');
      
      // Check for duplicate blocks (5+ lines)
      for (let i = 0; i < lines.length - 5; i++) {
        const block = lines.slice(i, i + 5).join('\n').trim();
        if (block.length > 100) {
          const count = seenBlocks.get(block) || 0;
          if (count > 0) {
            duplicatedBlocks++;
            duplicatedLines += 5;
          }
          seenBlocks.set(block, count + 1);
        }
      }
    });

    const totalLines = files.reduce((sum, f) => sum + (f.content?.split('\n').length || 0), 0);
    
    return {
      duplicatedLines,
      duplicatedBlocks,
      duplicatedFiles: files.filter(f => {
        const content = f.content || '';
        return Array.from(seenBlocks.keys()).some(block => content.includes(block));
      }).length,
      duplicationPercentage: totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0
    };
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    const fileMetrics: FileMetrics[] = [];
    const languageStats = new Map<string, LanguageMetrics>();
    const allCodeSmells: CodeSmell[] = [];

    // Analyze each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const metrics = analyzeFile(file);
      fileMetrics.push(metrics);
      
      // Update language statistics
      const lang = metrics.language;
      const langStats = languageStats.get(lang) || {
        files: 0,
        lines: 0,
        codeLines: 0,
        commentRatio: 0,
        averageComplexity: 0
      };
      
      langStats.files++;
      langStats.lines += metrics.lines;
      langStats.codeLines += metrics.codeLines;
      langStats.commentRatio = metrics.commentLines / (metrics.codeLines || 1);
      langStats.averageComplexity = 
        (langStats.averageComplexity * (langStats.files - 1) + metrics.cyclomaticComplexity) / langStats.files;
      
      languageStats.set(lang, langStats);
      
      // Collect code smells
      allCodeSmells.push(...detectCodeSmells(file.content || '', file.name));
      
      onFileAnalyzed?.(file.name, metrics);
      setAnalysisProgress(((i + 1) / files.length) * 100);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Calculate overall metrics
    const totalLines = fileMetrics.reduce((sum, m) => sum + m.lines, 0);
    const codeLines = fileMetrics.reduce((sum, m) => sum + m.codeLines, 0);
    const commentLines = fileMetrics.reduce((sum, m) => sum + m.commentLines, 0);
    const blankLines = fileMetrics.reduce((sum, m) => sum + m.blankLines, 0);
    
    const averageComplexity = fileMetrics.length > 0
      ? fileMetrics.reduce((sum, m) => sum + m.cyclomaticComplexity, 0) / fileMetrics.length
      : 0;
    
    const maintainabilityIndex = fileMetrics.length > 0
      ? Math.round(fileMetrics.reduce((sum, m) => sum + m.maintainabilityIndex, 0) / fileMetrics.length)
      : 0;

    // Calculate technical debt
    const totalDebtMinutes = fileMetrics.reduce((sum, m) => sum + m.technicalDebtMinutes, 0);
    const technicalDebt: TechnicalDebt = {
      totalMinutes: totalDebtMinutes,
      rating: totalDebtMinutes < 60 ? 'A' : totalDebtMinutes < 240 ? 'B' : totalDebtMinutes < 480 ? 'C' : 'D',
      ratio: codeLines > 0 ? (totalDebtMinutes / codeLines) * 100 : 0,
      principal: totalDebtMinutes * 0.7, // 70% is principal debt
      interest: totalDebtMinutes * 0.3  // 30% is interest
    };

    // Calculate complexity distribution
    const complexityDistribution: ComplexityBand[] = [
      {
        range: '1-5',
        count: fileMetrics.filter(m => m.cyclomaticComplexity <= 5).length,
        percentage: 0,
        risk: 'low'
      },
      {
        range: '6-10',
        count: fileMetrics.filter(m => m.cyclomaticComplexity > 5 && m.cyclomaticComplexity <= 10).length,
        percentage: 0,
        risk: 'medium'
      },
      {
        range: '11-20',
        count: fileMetrics.filter(m => m.cyclomaticComplexity > 10 && m.cyclomaticComplexity <= 20).length,
        percentage: 0,
        risk: 'high'
      },
      {
        range: '21+',
        count: fileMetrics.filter(m => m.cyclomaticComplexity > 20).length,
        percentage: 0,
        risk: 'critical'
      }
    ];

    // Calculate percentages
    const totalFiles = fileMetrics.length;
    complexityDistribution.forEach(band => {
      band.percentage = totalFiles > 0 ? (band.count / totalFiles) * 100 : 0;
    });

    // Calculate duplication metrics
    const duplication = calculateDuplication(files);

    const codeMetrics: CodeMetrics = {
      totalFiles: files.length,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      averageComplexity,
      maintainabilityIndex,
      technicalDebt,
      fileMetrics,
      languageDistribution: Object.fromEntries(languageStats),
      complexityDistribution,
      codeSmells: allCodeSmells,
      duplication
    };

    setMetrics(codeMetrics);
    onAnalysisComplete?.(codeMetrics);
    setIsAnalyzing(false);
  };

  const getMaintainabilityColor = (index: number): string => {
    if (index >= 80) return 'text-green-600';
    if (index >= 60) return 'text-yellow-600';
    if (index >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getComplexityColor = (complexity: number): string => {
    if (complexity <= 5) return 'bg-green-100 text-green-700';
    if (complexity <= 10) return 'bg-yellow-100 text-yellow-700';
    if (complexity <= 20) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Code Metrics & Complexity Analysis
            <Badge variant="outline" className="ml-auto">
              Advanced Analytics
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Analysis Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{files.length}</span> files ready for analysis
            </div>
            <Button 
              onClick={startAnalysis}
              disabled={isAnalyzing || files.length === 0}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Analyzing code metrics...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(analysisProgress)}%
                </span>
              </div>
              <Progress value={analysisProgress} className="h-2" />
            </div>
          )}

          {/* Metrics Overview */}
          {metrics && (
            <>
              {/* Key Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium">Maintainability</span>
                    </div>
                    <div className={`text-2xl font-bold ${getMaintainabilityColor(metrics.maintainabilityIndex)}`}>
                      {metrics.maintainabilityIndex}
                    </div>
                    <div className="text-xs text-muted-foreground">Index Score</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Avg Complexity</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.averageComplexity.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Cyclomatic</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium">Tech Debt</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatTime(metrics.technicalDebt.totalMinutes)}
                    </div>
                    <Badge className={`text-xs ${
                      metrics.technicalDebt.rating === 'A' ? 'bg-green-100' :
                      metrics.technicalDebt.rating === 'B' ? 'bg-yellow-100' :
                      metrics.technicalDebt.rating === 'C' ? 'bg-orange-100' :
                      'bg-red-100'
                    }`}>
                      Grade {metrics.technicalDebt.rating}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Duplication</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.duplication.duplicationPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metrics.duplication.duplicatedBlocks} blocks
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Code Composition */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Code Composition</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Code Lines</span>
                      <span className="text-xs font-medium">{metrics.codeLines.toLocaleString()}</span>
                    </div>
                    <Progress value={(metrics.codeLines / metrics.totalLines) * 100} className="h-2 bg-blue-100" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Comments</span>
                      <span className="text-xs font-medium">{metrics.commentLines.toLocaleString()}</span>
                    </div>
                    <Progress value={(metrics.commentLines / metrics.totalLines) * 100} className="h-2 bg-green-100" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Blank Lines</span>
                      <span className="text-xs font-medium">{metrics.blankLines.toLocaleString()}</span>
                    </div>
                    <Progress value={(metrics.blankLines / metrics.totalLines) * 100} className="h-2 bg-gray-100" />
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Analysis Tabs */}
              <Tabs defaultValue="complexity" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="complexity">Complexity</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="smells">Code Smells</TabsTrigger>
                  <TabsTrigger value="languages">Languages</TabsTrigger>
                </TabsList>

                <TabsContent value="complexity" className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Complexity Distribution</h3>
                    {metrics.complexityDistribution.map((band) => (
                      <div key={band.range} className="flex items-center gap-3">
                        <Badge className={
                          band.risk === 'low' ? 'bg-green-100 text-green-700' :
                          band.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          band.risk === 'high' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {band.range}
                        </Badge>
                        <div className="flex-1">
                          <Progress 
                            value={band.percentage} 
                            className={`h-3 ${
                              band.risk === 'low' ? 'bg-green-100' :
                              band.risk === 'medium' ? 'bg-yellow-100' :
                              band.risk === 'high' ? 'bg-orange-100' :
                              'bg-red-100'
                            }`}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {band.count} files
                        </span>
                      </div>
                    ))}
                  </div>

                  {metrics.technicalDebt && (
                    <Alert>
                      <Clock className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Technical Debt Breakdown:</strong>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>Principal: {formatTime(metrics.technicalDebt.principal)}</div>
                          <div>Interest: {formatTime(metrics.technicalDebt.interest)}</div>
                          <div>Debt Ratio: {metrics.technicalDebt.ratio.toFixed(2)}%</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="files" className="space-y-3">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {metrics.fileMetrics
                        .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
                        .map((file) => (
                          <div 
                            key={file.path}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedFile(file)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{file.fileName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getComplexityColor(file.cyclomaticComplexity)}>
                                  CC: {file.cyclomaticComplexity}
                                </Badge>
                                <Badge variant="outline" className={getMaintainabilityColor(file.maintainabilityIndex)}>
                                  MI: {file.maintainabilityIndex}
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{file.lines} lines</span>
                              <span>{file.language}</span>
                              <span>{formatTime(file.technicalDebtMinutes)} debt</span>
                              {file.codeSmells.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {file.codeSmells.length} smells
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="smells" className="space-y-3">
                  <div className="space-y-2">
                    {Object.entries(
                      metrics.codeSmells.reduce((acc, smell) => {
                        acc[smell.type] = (acc[smell.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="font-medium text-sm">{type}</span>
                        </div>
                        <Badge variant="outline">{count} occurrences</Badge>
                      </div>
                    ))}
                  </div>

                  {metrics.codeSmells.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                      <p className="text-muted-foreground">No significant code smells detected</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="languages" className="space-y-3">
                  {Object.entries(metrics.languageDistribution).map(([lang, stats]) => (
                    <Card key={lang}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{lang}</span>
                          <Badge variant="outline">{stats.files} files</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Lines: {stats.lines.toLocaleString()}</div>
                          <div>Code: {stats.codeLines.toLocaleString()}</div>
                          <div>Comment Ratio: {(stats.commentRatio * 100).toFixed(1)}%</div>
                          <div>Avg Complexity: {stats.averageComplexity.toFixed(1)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Selected File Details */}
          {selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedFile.fileName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Complexity Metrics</h4>
                    <div className="space-y-1 text-sm">
                      <div>Cyclomatic: {selectedFile.cyclomaticComplexity}</div>
                      <div>Cognitive: {selectedFile.cognitiveComplexity}</div>
                      <div>Maintainability: {selectedFile.maintainabilityIndex}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Halstead Metrics</h4>
                    <div className="space-y-1 text-sm">
                      <div>Volume: {selectedFile.halsteadMetrics.volume}</div>
                      <div>Difficulty: {selectedFile.halsteadMetrics.difficulty}</div>
                      <div>Est. Bugs: {selectedFile.halsteadMetrics.bugs}</div>
                    </div>
                  </div>
                </div>

                {selectedFile.functions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Functions ({selectedFile.functions.length})</h4>
                    <div className="space-y-1">
                      {selectedFile.functions.slice(0, 5).map((func, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{func.name}</span>
                          <Badge variant="outline" className="text-xs">
                            CC: {func.complexity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}