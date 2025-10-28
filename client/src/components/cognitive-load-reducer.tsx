import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Brain, Zap, Eye, Focus, MinusCircle } from 'lucide-react';

interface CognitiveLoadReducerProps {
  onLoadChange?: (load: number) => void;
  currentView?: string;
}

interface ReductionTechnique {
  name: string;
  description: string;
  reduction: number;
  active: boolean;
}

export function CognitiveLoadReducer({ onLoadChange, currentView }: CognitiveLoadReducerProps) {
  const [cognitiveLoad, setCognitiveLoad] = useState(75);
  const [reductionTechniques, setReductionTechniques] = useState<ReductionTechnique[]>([
    {
      name: 'Progressive Disclosure',
      description: 'Hide complexity behind simple interfaces',
      reduction: 15,
      active: true,
    },
    {
      name: 'Contextual Chunking',
      description: 'Group related information together',
      reduction: 12,
      active: true,
    },
    {
      name: 'Visual Hierarchy',
      description: 'Use typography and layout to guide attention',
      reduction: 10,
      active: true,
    },
    {
      name: 'Predictive Loading',
      description: 'Anticipate user needs and preload content',
      reduction: 8,
      active: false,
    },
    {
      name: 'Effortless Navigation',
      description: 'Minimize steps between related actions',
      reduction: 11,
      active: false,
    },
    {
      name: 'Intelligent Defaults',
      description: 'Pre-select likely user choices',
      reduction: 9,
      active: false,
    },
  ]);

  const calculateTotalReduction = useCallback(() => {
    return reductionTechniques
      .filter(technique => technique.active)
      .reduce((total, technique) => total + technique.reduction, 0);
  }, [reductionTechniques]);

  const effectiveLoad = Math.max(5, cognitiveLoad - calculateTotalReduction());

  useEffect(() => {
    onLoadChange?.(effectiveLoad);
  }, [effectiveLoad, onLoadChange]);

  const toggleTechnique = (index: number) => {
    setReductionTechniques(prev =>
      prev.map((technique, i) =>
        i === index ? { ...technique, active: !technique.active } : technique
      )
    );
  };

  const getLoadColor = (load: number) => {
    if (load < 25) return 'text-green-600 bg-green-50';
    if (load < 50) return 'text-yellow-600 bg-yellow-50';
    if (load < 75) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getFlowState = (load: number) => {
    if (load < 20)
      return { state: 'Flow State', color: 'text-green-600', icon: <Zap className="w-4 h-4" /> };
    if (load < 40)
      return { state: 'Wu Wei', color: 'text-blue-600', icon: <Eye className="w-4 h-4" /> };
    if (load < 60)
      return { state: 'Focused', color: 'text-yellow-600', icon: <Focus className="w-4 h-4" /> };
    return { state: 'Overwhelmed', color: 'text-red-600', icon: <Brain className="w-4 h-4" /> };
  };

  const flowState = getFlowState(effectiveLoad);

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Cognitive Load Reducer
          <Badge variant="outline" className="ml-auto">
            Aurora Enhancement
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Load Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Cognitive Load</span>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${getLoadColor(effectiveLoad)}`}>{effectiveLoad}%</Badge>
              <div className={`flex items-center gap-1 ${flowState.color}`}>
                {flowState.icon}
                <span className="text-xs font-medium">{flowState.state}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={effectiveLoad} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Flow (0-20%)</span>
              <span>Wu Wei (20-40%)</span>
              <span>Focused (40-60%)</span>
              <span>Overload (60%+)</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-red-600">{cognitiveLoad}%</div>
              <div className="text-xs text-muted-foreground">Base Load</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">-{calculateTotalReduction()}%</div>
              <div className="text-xs text-muted-foreground">Reduction</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">{effectiveLoad}%</div>
              <div className="text-xs text-muted-foreground">Effective Load</div>
            </div>
          </div>
        </div>

        {/* Reduction Techniques */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Load Reduction Techniques</h3>
          <div className="space-y-3">
            {reductionTechniques.map((technique, index) => (
              <div
                key={technique.name}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{technique.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      -{technique.reduction}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{technique.description}</p>
                </div>
                <Switch checked={technique.active} onCheckedChange={() => toggleTechnique(index)} />
              </div>
            ))}
          </div>
        </div>

        {/* Context-Aware Recommendations */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Context Recommendations</h3>
          <div className="p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
            {currentView === 'main' && (
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">File Explorer Optimization</p>
                <p className="text-blue-700 text-xs">
                  Enable predictive loading to pre-fetch likely file selections based on your
                  browsing patterns.
                </p>
              </div>
            )}
            {currentView === 'symbolic' && (
              <div className="text-sm">
                <p className="font-medium text-green-800 mb-1">Symbolic Interface Flow</p>
                <p className="text-green-700 text-xs">
                  Wu Wei mode active - commands will execute with minimal conscious effort. Trust
                  your intuitive selections.
                </p>
              </div>
            )}
            {!['main', 'symbolic'].includes(currentView || '') && (
              <div className="text-sm">
                <p className="font-medium text-purple-800 mb-1">Aurora Flow State</p>
                <p className="text-purple-700 text-xs">
                  Current interface optimized for{' '}
                  {effectiveLoad < 30 ? 'effortless flow' : 'focused attention'}.
                  {effectiveLoad > 60 && ' Consider enabling more reduction techniques.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCognitiveLoad(prev => Math.max(10, prev - 10))}
            className="flex items-center gap-1"
          >
            <MinusCircle className="w-3 h-3" />
            Reduce Load
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReductionTechniques(prev =>
                prev.map(technique => ({ ...technique, active: true }))
              );
            }}
            className="flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Activate All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
