import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Waves, Leaf, Wind, Mountain, Droplets, Sun } from 'lucide-react';

interface WuWeiInterfaceProps {
  onAction?: (action: string, natural: boolean) => void;
  currentFlow?: number;
}

interface NaturalPattern {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  guidance: string[];
  efficiency: number;
}

export function WuWeiInterface({ onAction, currentFlow = 0 }: WuWeiInterfaceProps) {
  const [selectedPattern, setSelectedPattern] = useState<string>('water');
  const [effortLevel, setEffortLevel] = useState(0);
  const [naturalAlignment, setNaturalAlignment] = useState(75);
  const [actionQueue, setActionQueue] = useState<string[]>([]);
  const [isFlowing, setIsFlowing] = useState(false);

  const naturalPatterns: NaturalPattern[] = [
    {
      id: 'water',
      name: 'Water Flow',
      description: 'Adapt to obstacles, find natural paths',
      icon: <Droplets className="w-4 h-4" />,
      guidance: [
        'Flow around resistance rather than through it',
        'Seek the path of least resistance',
        'Maintain persistent, gentle pressure',
      ],
      efficiency: 95,
    },
    {
      id: 'wind',
      name: 'Wind Pattern',
      description: 'Move with invisible currents, respond to conditions',
      icon: <Wind className="w-4 h-4" />,
      guidance: [
        'Read the currents of the system',
        'Respond to natural rhythms and cycles',
        'Apply force at optimal moments',
      ],
      efficiency: 88,
    },
    {
      id: 'mountain',
      name: 'Mountain Stability',
      description: 'Remain centered while everything flows around you',
      icon: <Mountain className="w-4 h-4" />,
      guidance: [
        'Maintain inner stillness amid external activity',
        'Provide stable foundation for others',
        'Respond from deep centeredness',
      ],
      efficiency: 92,
    },
    {
      id: 'leaf',
      name: 'Leaf Dance',
      description: 'Move with natural rhythms, minimal resistance',
      icon: <Leaf className="w-4 h-4" />,
      guidance: [
        'Follow natural rhythms and seasons',
        'Bend without breaking under pressure',
        'Trust the wisdom of natural timing',
      ],
      efficiency: 87,
    },
  ];

  const currentPattern = naturalPatterns.find(p => p.id === selectedPattern) || naturalPatterns[0];

  useEffect(() => {
    if (isFlowing) {
      const interval = setInterval(() => {
        // Simulate natural efficiency improvements
        setNaturalAlignment(prev => {
          const target = currentPattern.efficiency;
          const diff = target - prev;
          return Math.round(prev + diff * 0.1);
        });

        // Reduce effort as naturalness increases
        setEffortLevel(prev => Math.max(0, prev - 2));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isFlowing, currentPattern.efficiency]);

  const processNaturalAction = useCallback(
    (action: string) => {
      // Apply wu wei principles to the action
      const isNatural = effortLevel < 30 && naturalAlignment > 70;

      if (isNatural) {
        setActionQueue(prev => [...prev, `✓ ${action} (wu wei)`]);
        onAction?.(action, true);
      } else {
        setActionQueue(prev => [...prev, `○ ${action} (effort: ${effortLevel}%)`]);
        onAction?.(action, false);
      }

      // Natural actions reduce effort
      if (isNatural) {
        setEffortLevel(prev => Math.max(0, prev - 5));
      } else {
        setEffortLevel(prev => Math.min(100, prev + 10));
      }
    },
    [effortLevel, naturalAlignment, onAction]
  );

  const getEffortColor = (effort: number) => {
    if (effort < 20) return 'text-green-600 bg-green-50';
    if (effort < 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAlignmentColor = (alignment: number) => {
    if (alignment > 80) return 'text-green-600';
    if (alignment > 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-600" />
            Wu Wei Interface
            <Badge variant="outline" className="ml-auto">
              Effortless Action
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Natural Pattern Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Natural Pattern</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {naturalPatterns.map(pattern => (
                <Button
                  key={pattern.id}
                  variant={selectedPattern === pattern.id ? 'default' : 'outline'}
                  onClick={() => setSelectedPattern(pattern.id)}
                  className="h-auto py-3 flex flex-col gap-1"
                >
                  {pattern.icon}
                  <span className="text-xs">{pattern.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {pattern.efficiency}%
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Pattern Guidance */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              {currentPattern.icon}
              <h4 className="font-medium">{currentPattern.name}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{currentPattern.description}</p>
            <div className="space-y-1">
              {currentPattern.guidance.map((guide, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  {guide}
                </div>
              ))}
            </div>
          </div>

          {/* Flow State Indicators */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Effort Level</span>
                <Badge className={`text-xs ${getEffortColor(effortLevel)}`}>{effortLevel}%</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${effortLevel}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Natural Alignment</span>
                <Badge className={`text-xs ${getAlignmentColor(naturalAlignment)}`}>
                  {naturalAlignment}%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${naturalAlignment}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Input */}
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium">Natural Action</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Describe your intended action..."
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    processNaturalAction(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={() => setIsFlowing(!isFlowing)}
                variant={isFlowing ? 'default' : 'outline'}
                className="shrink-0"
              >
                {isFlowing ? 'Flowing' : 'Begin Flow'}
              </Button>
            </div>
          </div>

          {/* Action History */}
          {actionQueue.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium">Recent Actions</h3>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {actionQueue.slice(-10).map((action, index) => (
                  <div
                    key={index}
                    className="text-xs text-muted-foreground p-2 bg-muted/30 rounded"
                  >
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wu Wei Insights */}
          {isFlowing && naturalAlignment > 80 && effortLevel < 20 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Wu Wei State Active</span>
              </div>
              <p className="text-xs text-green-700">
                You are in harmony with natural patterns. Actions flow effortlessly with minimal
                resistance. Trust your intuitive responses and maintain this centered awareness.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
