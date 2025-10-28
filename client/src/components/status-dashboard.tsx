import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Clock, Lock, Shield, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface StatusDashboardProps {
  archiveId: string;
}

interface StatusData {
  symbolicChain: string;
  threadTag: string;
  ethicsLock: string;
  trustAnchor: string;
  deploymentStatus: {
    guiHabitat: boolean;
    glyphcardExport: boolean;
    zipBundle: string;
    monitoring: string;
    acknowledgment: boolean;
  };
  replayState: {
    replayable: boolean;
    continuityAnchors: string;
  };
  activitySummary?: {
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCritical: any[];
  };
}

export function StatusDashboard({ archiveId }: StatusDashboardProps) {
  const { data: response, isLoading } = useQuery<{ success: boolean; data: StatusData }>({
    queryKey: [`/api/v1/archives/${archiveId}/status`],
    enabled: !!archiveId,
  });

  if (isLoading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-purple-200 rounded w-3/4"></div>
            <div className="h-4 bg-purple-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response?.data) return null;

  const {
    symbolicChain,
    threadTag,
    ethicsLock,
    trustAnchor,
    deploymentStatus,
    replayState,
    activitySummary,
  } = response.data;

  return (
    <Card className="border-purple-300 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          ZIP Wizard v2.2.6b Status Dashboard
        </CardTitle>
        <CardDescription className="text-purple-700">
          Quantum-Enhanced Archive Analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Symbolic Chain Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Symbolic Chain
          </h3>
          <code className="block p-3 bg-black/5 rounded-md text-xs font-mono text-purple-900 overflow-x-auto">
            {symbolicChain}
          </code>
        </div>

        {/* Thread Tag Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-purple-700">Thread Tag</h3>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {threadTag}
          </Badge>
        </div>

        <Separator className="bg-purple-200" />

        {/* Security Context */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Ethics Lock
            </h3>
            <Badge variant="outline" className="border-purple-300 text-purple-700">
              {ethicsLock}
            </Badge>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Trust Anchor
            </h3>
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              {trustAnchor}
            </Badge>
          </div>
        </div>

        <Separator className="bg-purple-200" />

        {/* Deployment Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-purple-700">Deployment Status</h3>
          <div className="space-y-2">
            <StatusItem label="GUI Habitat" status={deploymentStatus.guiHabitat} />
            <StatusItem label="Glyphcard Export" status={deploymentStatus.glyphcardExport} />
            <StatusItem label="ZIP Bundle" value={deploymentStatus.zipBundle} />
            <StatusItem
              label="Monitoring"
              value={deploymentStatus.monitoring}
              status={deploymentStatus.monitoring === 'Active'}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatusItem label="Acknowledgment" status={deploymentStatus.acknowledgment} pending />
          </div>
        </div>

        <Separator className="bg-purple-200" />

        {/* Replay State */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-purple-700">Replay State</h3>
          <div className="space-y-2">
            <StatusItem label="Replayable" status={replayState.replayable} />
            <StatusItem label="Continuity Anchors" value={replayState.continuityAnchors} />
          </div>
        </div>

        {/* Activity Summary */}
        {activitySummary && (
          <>
            <Separator className="bg-purple-200" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-purple-700">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-purple-600">Total Events</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {activitySummary.totalEvents}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-purple-600">Critical Events</p>
                  <p className="text-2xl font-bold text-red-600">
                    {activitySummary.recentCritical?.length || 0}
                  </p>
                </div>
              </div>

              {/* Event Type Distribution */}
              <div className="space-y-2">
                <p className="text-xs text-purple-600">Event Distribution</p>
                {Object.entries(activitySummary.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-xs text-purple-700 capitalize">{type}</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(count / activitySummary.totalEvents) * 100}
                        className="w-24 h-2"
                      />
                      <span className="text-xs text-purple-600 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusItemProps {
  label: string;
  status?: boolean;
  value?: string;
  pending?: boolean;
  icon?: React.ReactNode;
}

function StatusItem({ label, status, value, pending, icon }: StatusItemProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-white/50">
      <span className="text-sm text-purple-700">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        {status !== undefined && (
          <>
            {pending ? (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Pending
              </Badge>
            ) : status ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </>
        )}
        {value && (
          <span className="text-sm text-purple-600 font-medium max-w-[200px] truncate">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
