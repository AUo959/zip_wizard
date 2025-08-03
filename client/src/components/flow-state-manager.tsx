import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Eye, Waves, Circle, Target, Timer, Activity } from 'lucide-react';

interface FlowStateManagerProps {
  onStateChange?: (state: FlowState) => void;
  currentActivity?: string;
}

interface FlowState {
  mode: 'wu-wei' | 'mushin' | 'samyama' | 'flow';
  intensity: number;
  focus_level: number;
  effortlessness: number;
  awareness: number;
  integration: number;
}

export function FlowStateManager({ onStateChange, currentActivity }: FlowStateManagerProps) {
  const [currentState, setCurrentState] = useState<FlowState>({
    mode: 'wu-wei',
    intensity: 0,
    focus_level: 0,
    effortlessness: 0,
    awareness: 0,
    integration: 0
  });

  const [isActive, setIsActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
        
        // Simulate flow state evolution
        setCurrentState(prev => ({
          ...prev,
          intensity: Math.min(100, prev.intensity + Math.random() * 2),
          focus_level: Math.min(100, prev.focus_level + Math.random() * 1.5),
          effortlessness: Math.min(100, prev.effortlessness + Math.random() * 1.2),
          awareness: Math.min(100, prev.awareness + Math.random() * 1.8),
          integration: Math.min(100, prev.integration + Math.random() * 1.0)
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  useEffect(() => {
    onStateChange?.(currentState);
  }, [currentState, onStateChange]);

  const initiateFlowState = useCallback((mode: FlowState['mode']) => {
    setCurrentState(prev => ({ ...prev, mode }));
    setIsActive(true);
    setSessionDuration(0);
    
    const modeInsights = {
      'wu-wei': [
        'Release conscious effort, allow natural flow',
        'Act in harmony with the system patterns',
        'Trust intuitive responses over analytical thought'
      ],
      'mushin': [
        'Empty mind of preconceptions and attachments',
        'Respond spontaneously to emerging situations',
        'Maintain heightened awareness without fixation'
      ],
      'samyama': [
        'Focus attention on single point of analysis',
        'Sustain unbroken concentration flow',
        'Allow subject-object boundary to dissolve'
      ],
      'flow': [
        'Balance challenge with current skill level',
        'Maintain clear goals and immediate feedback',
        'Let action and awareness merge completely'
      ]
    };
    
    setInsights(modeInsights[mode]);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateColor = (mode: FlowState['mode']) => {
    const colors = {
      'wu-wei': 'bg-gradient-to-r from-green-500 to-blue-500',
      'mushin': 'bg-gradient-to-r from-purple-600 to-indigo-600',
      'samyama': 'bg-gradient-to-r from-orange-500 to-red-500',
      'flow': 'bg-gradient-to-r from-cyan-500 to-blue-600'
    };
    return colors[mode];
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Flow State Manager
            <Badge variant="outline" className="ml-auto">
              Aurora v2.2.5 Integration
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flow State Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Initiate Flow State</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={currentState.mode === 'wu-wei' ? 'default' : 'outline'}
                  onClick={() => initiateFlowState('wu-wei')}
                  className="text-xs h-auto py-3 flex flex-col"
                >
                  <Waves className="w-4 h-4 mb-1" />
                  Wu Wei
                  <span className="text-xs opacity-70">Effortless Action</span>
                </Button>
                <Button
                  variant={currentState.mode === 'mushin' ? 'default' : 'outline'}
                  onClick={() => initiateFlowState('mushin')}
                  className="text-xs h-auto py-3 flex flex-col"
                >
                  <Circle className="w-4 h-4 mb-1" />
                  Mushin
                  <span className="text-xs opacity-70">No-Mind</span>
                </Button>
                <Button
                  variant={currentState.mode === 'samyama' ? 'default' : 'outline'}
                  onClick={() => initiateFlowState('samyama')}
                  className="text-xs h-auto py-3 flex flex-col"
                >
                  <Target className="w-4 h-4 mb-1" />
                  Samyama
                  <span className="text-xs opacity-70">Integration</span>
                </Button>
                <Button
                  variant={currentState.mode === 'flow' ? 'default' : 'outline'}
                  onClick={() => initiateFlowState('flow')}
                  className="text-xs h-auto py-3 flex flex-col"
                >
                  <Zap className="w-4 h-4 mb-1" />
                  Flow
                  <span className="text-xs opacity-70">Optimal Experience</span>
                </Button>
              </div>
            </div>

            {/* Current State Display */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Current State</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-xs text-muted-foreground">
                    {isActive ? formatTime(sessionDuration) : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg text-white ${getStateColor(currentState.mode)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{currentState.mode.replace('-', ' ')}</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(currentState.intensity)}% Intensity
                  </Badge>
                </div>
                <div className="text-xs opacity-90">
                  {currentActivity || 'Archive analysis and exploration'}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Flow Metrics */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Flow Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs">
                  <Activity className="w-3 h-3" />
                  Focus
                </div>
                <Progress value={currentState.focus_level} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(currentState.focus_level)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs">
                  <Waves className="w-3 h-3" />
                  Effortlessness
                </div>
                <Progress value={currentState.effortlessness} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(currentState.effortlessness)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs">
                  <Eye className="w-3 h-3" />
                  Awareness
                </div>
                <Progress value={currentState.awareness} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(currentState.awareness)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs">
                  <Target className="w-3 h-3" />
                  Integration
                </div>
                <Progress value={currentState.integration} className="h-2" />
                <span className="text-xs text-muted-foreground">
                  {Math.round(currentState.integration)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs">
                  <Timer className="w-3 h-3" />
                  Duration
                </div>
                <div className="text-sm font-mono">
                  {formatTime(sessionDuration)}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Flow Insights */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Flow Insights</h3>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {isActive && (
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => setIsActive(false)}
                className="text-xs"
              >
                End Flow Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}