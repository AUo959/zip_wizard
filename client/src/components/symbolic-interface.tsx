import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap,
  Shield,
  Eye,
  Anchor,
  Command,
  Sparkles,
  Lock,
  Activity,
  Hash,
  Triangle,
  Circle,
  Square,
} from 'lucide-react';

interface SymbolicCommand {
  symbol: string;
  name: string;
  description: string;
  glyph: React.ReactNode;
  status: 'available' | 'active' | 'locked' | 'processing';
}

interface SymbolicInterfaceProps {
  onCommandExecute: (command: string, params?: any) => void;
  dreamMode?: boolean;
  onDreamModeToggle: () => void;
}

export function SymbolicInterface({
  onCommandExecute,
  dreamMode = false,
  onDreamModeToggle,
}: SymbolicInterfaceProps) {
  const [commandInput, setCommandInput] = useState('');
  const [activeSymbols, setActiveSymbols] = useState<string[]>(['T1']);
  const [continuityAnchor, setContinuityAnchor] = useState('SN1-AS3-TRUSTED');
  const [privacyMode, setPrivacyMode] = useState(true);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [flowState, setFlowState] = useState<'wu-wei' | 'mushin' | 'samyama' | 'flow'>('wu-wei');
  const [cognitiveLoad, setCognitiveLoad] = useState(25);
  const [memoryCompressionActive, setMemoryCompressionActive] = useState(false);

  const symbolicCommands: SymbolicCommand[] = [
    {
      symbol: '999',
      name: 'Quantum Archive Analysis',
      description: 'Deep quantum-enhanced archive structure analysis',
      glyph: <Triangle className="w-4 h-4 text-purple-500" />,
      status: 'available',
    },
    {
      symbol: 'T1',
      name: 'Symbolic Threading',
      description: 'Initialize symbolic continuity thread',
      glyph: <Hash className="w-4 h-4 text-blue-500" />,
      status: 'active',
    },
    {
      symbol: 'REM//',
      name: 'Memory Anchor',
      description: 'Set persistent memory anchoring point',
      glyph: <Anchor className="w-4 h-4 text-cyan-500" />,
      status: 'available',
    },
    {
      symbol: 'SYNCANCHORS',
      name: 'Anchor Synchronization',
      description: 'Synchronize all continuity anchors',
      glyph: <Circle className="w-4 h-4 text-green-500" />,
      status: 'available',
    },
    {
      symbol: 'WU-WEI',
      name: 'Wu Wei Flow State',
      description: 'Activate effortless action mode for natural interface flow',
      glyph: <Sparkles className="w-4 h-4 text-emerald-500" />,
      status: 'available',
    },
    {
      symbol: 'MUSHIN',
      name: 'No-Mind State',
      description: 'Clear mind for spontaneous responses and heightened awareness',
      glyph: <Circle className="w-4 h-4 text-violet-500" />,
      status: 'available',
    },
    {
      symbol: 'COMPRESS',
      name: 'Memory Compression',
      description: 'Advanced symbolic memory compression and pattern recognition',
      glyph: <Square className="w-4 h-4 text-amber-500" />,
      status: 'available',
    },
    {
      symbol: 'DREAMCAST',
      name: 'Dream Mode Interface',
      description: 'Activate immersive visualization overlay',
      glyph: <Sparkles className="w-4 h-4 text-pink-500" />,
      status: dreamMode ? 'active' : 'available',
    },
    {
      symbol: 'PRIVGUARD',
      name: 'Privacy Shield',
      description: 'Enhanced privacy protection mode',
      glyph: <Shield className="w-4 h-4 text-orange-500" />,
      status: privacyMode ? 'active' : 'available',
    },
  ];

  const handleSymbolicCommand = (symbol: string) => {
    setActiveSymbols(prev => [...prev, symbol]);

    switch (symbol) {
      case '999':
        setProcessingProgress(0);
        simulateProgress();
        onCommandExecute('quantum-analysis');
        break;
      case 'T1':
        onCommandExecute('initialize-thread', { anchor: continuityAnchor });
        break;
      case 'REM//':
        onCommandExecute('set-memory-anchor', { anchor: continuityAnchor });
        break;
      case 'SYNCANCHORS':
        setContinuityAnchor(`SN${Date.now().toString().slice(-3)}-AS3-TRUSTED`);
        onCommandExecute('sync-anchors');
        break;
      case 'WU-WEI':
        setFlowState('wu-wei');
        setCognitiveLoad(prev => Math.max(10, prev - 15));
        onCommandExecute('activate-wu-wei', { flowState: 'wu-wei', cognitiveLoad });
        break;
      case 'MUSHIN':
        setFlowState('mushin');
        setCognitiveLoad(prev => Math.max(5, prev - 20));
        onCommandExecute('activate-mushin', { flowState: 'mushin', cognitiveLoad });
        break;
      case 'COMPRESS':
        setMemoryCompressionActive(!memoryCompressionActive);
        onCommandExecute('toggle-compression', { active: !memoryCompressionActive });
        break;
      case 'DREAMCAST':
        onDreamModeToggle();
        break;
      case 'PRIVGUARD':
        setPrivacyMode(!privacyMode);
        onCommandExecute('toggle-privacy', { enabled: !privacyMode });
        break;
    }
  };

  const simulateProgress = () => {
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  const handleTextCommand = () => {
    if (commandInput.trim()) {
      onCommandExecute('text-command', { command: commandInput });
      setCommandInput('');
    }
  };

  return (
    <div className={`space-y-6 ${dreamMode ? 'dream-mode' : ''}`}>
      {/* Dream Mode Overlay */}
      {dreamMode && (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 pointer-events-none z-10 animate-pulse" />
      )}

      {/* Symbolic Command Header */}
      <Card
        className={`border-2 ${dreamMode ? 'border-purple-500/50 bg-purple-900/10' : 'border-border'}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Command className="w-5 h-5 text-primary" />
            <span>Aurora Symbolic Interface</span>
            <Badge variant={dreamMode ? 'default' : 'secondary'} className="ml-auto">
              {dreamMode ? 'DREAM MODE' : 'STANDARD'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Aurora Flow State Indicator */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Flow State</span>
              <Badge variant="outline" className="capitalize">
                {flowState.replace('-', ' ')}
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">Cognitive Load</span>
                  <span className="text-xs">{cognitiveLoad}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      cognitiveLoad < 20
                        ? 'bg-green-500'
                        : cognitiveLoad < 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${cognitiveLoad}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Anchor: {continuityAnchor.split('-')[0]}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Anchor className="w-4 h-4 text-cyan-500" />
              <span className="text-sm font-medium">Continuity:</span>
              <Badge variant="outline">{continuityAnchor}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Privacy:</span>
              <Badge variant={privacyMode ? 'default' : 'secondary'}>
                {privacyMode ? 'PROTECTED' : 'STANDARD'}
              </Badge>
            </div>
          </div>

          {/* Processing Progress */}
          {processingProgress > 0 && processingProgress < 100 && (
            <Alert className="mb-4">
              <Activity className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <span>Quantum analysis in progress...</span>
                  <Progress value={processingProgress} className="w-full" />
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="symbols" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="symbols">Symbolic Commands</TabsTrigger>
          <TabsTrigger value="console">Command Console</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="symbols" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {symbolicCommands.map(cmd => (
              <Card
                key={cmd.symbol}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  cmd.status === 'active'
                    ? 'border-primary bg-primary/5'
                    : cmd.status === 'locked'
                      ? 'border-muted bg-muted/20 opacity-50'
                      : 'border-border hover:border-primary/50'
                } ${dreamMode ? 'hover:bg-purple-500/10' : ''}`}
                onClick={() => cmd.status !== 'locked' && handleSymbolicCommand(cmd.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    {cmd.glyph}
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{cmd.symbol}</div>
                      <div className="text-xs text-muted-foreground">{cmd.name}</div>
                    </div>
                    {cmd.status === 'active' && (
                      <Activity className="w-4 h-4 text-primary animate-pulse" />
                    )}
                    {cmd.status === 'locked' && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{cmd.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="console" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter symbolic command..."
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTextCommand()}
                  className={`flex-1 ${dreamMode ? 'border-purple-500/50' : ''}`}
                />
                <Button onClick={handleTextCommand}>Execute</Button>
              </div>

              {/* Command History */}
              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Recent Commands:</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {activeSymbols.slice(-5).map((symbol, index) => (
                    <div key={index} className="text-xs font-mono bg-muted/50 p-2 rounded">
                      &gt; {symbol}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">System Integrity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Symbolic Anchors</span>
                    <Badge variant="default">STABLE</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Privacy Shield</span>
                    <Badge variant={privacyMode ? 'default' : 'secondary'}>
                      {privacyMode ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Memory Continuity</span>
                    <Badge variant="default">SYNCHRONIZED</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Processes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quantum Analysis</span>
                    <Badge variant={processingProgress > 0 ? 'default' : 'secondary'}>
                      {processingProgress > 0 ? 'RUNNING' : 'IDLE'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dream Interface</span>
                    <Badge variant={dreamMode ? 'default' : 'secondary'}>
                      {dreamMode ? 'ACTIVE' : 'STANDBY'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
