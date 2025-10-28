import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Scan,
  FileText,
  Database,
  Server,
  Key,
  UserCheck,
  Clock,
} from 'lucide-react';

interface PrivacySettings {
  dataRedaction: boolean;
  anonymization: boolean;
  encryptedStorage: boolean;
  auditLogging: boolean;
  gdprCompliance: boolean;
  zeroKnowledgeMode: boolean;
}

interface SecurityScan {
  filename: string;
  riskLevel: 'low' | 'medium' | 'high';
  issues: string[];
  status: 'scanned' | 'scanning' | 'pending';
}

interface PrivacyShieldProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  onSettingsChange: (settings: PrivacySettings) => void;
}

export function PrivacyShield({ isActive, onToggle, onSettingsChange }: PrivacyShieldProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataRedaction: true,
    anonymization: false,
    encryptedStorage: true,
    auditLogging: true,
    gdprCompliance: true,
    zeroKnowledgeMode: false,
  });

  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<SecurityScan[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [complianceScore, setComplianceScore] = useState(85);

  const exportAuditLogs = () => {
    const auditData = [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        action: 'Privacy Shield Activated',
        user: 'System',
        details: 'All privacy protection features enabled',
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        action: 'Security Scan Completed',
        user: 'User',
        details: '5 files scanned, 2 issues found',
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        action: 'Data Redaction Applied',
        user: 'System',
        details: 'Sensitive data redacted in processing logs',
      },
    ];

    const exportData = {
      exportedAt: new Date().toISOString(),
      privacySettings: settings,
      complianceScore,
      auditLog: auditData,
      scanResults,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-audit-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    onSettingsChange(settings);
  }, [settings, onSettingsChange]);

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const startSecurityScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResults([]);

    // Simulate security scan
    const mockFiles = ['config.json', 'user_data.csv', 'api_keys.txt', 'logs.txt', 'database.sql'];

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);

          // Generate mock scan results
          const results: SecurityScan[] = mockFiles.map(filename => ({
            filename,
            riskLevel: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
            issues: [
              'Contains potential PII data',
              'Unencrypted sensitive information',
              'Missing data classification',
            ].slice(0, Math.floor(Math.random() * 3) + 1),
            status: 'scanned',
          }));

          setScanResults(results);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 300);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-500 bg-red-100';
      case 'medium':
        return 'text-yellow-500 bg-yellow-100';
      case 'low':
        return 'text-green-500 bg-green-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Privacy Shield Header */}
      <Card
        className={`border-2 ${isActive ? 'border-green-500 bg-green-50/50' : 'border-orange-500 bg-orange-50/50'}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-orange-600'}`} />
              <span>Privacy Shield</span>
              <Badge variant={isActive ? 'default' : 'destructive'}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
            <Switch checked={isActive} onCheckedChange={onToggle} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? 'Privacy protection is active. All data processing follows privacy-first principles.'
                  : 'Privacy protection is disabled. Enable for enhanced data security.'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">Compliance Score</div>
              <div className={`text-2xl font-bold ${getComplianceColor(complianceScore)}`}>
                {complianceScore}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="scanning">Security Scan</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Processing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">Data Redaction</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically redact sensitive information in logs
                    </div>
                  </div>
                  <Switch
                    checked={settings.dataRedaction}
                    onCheckedChange={value => handleSettingChange('dataRedaction', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">User Anonymization</div>
                    <div className="text-sm text-muted-foreground">
                      Replace user identifiers with anonymous tokens
                    </div>
                  </div>
                  <Switch
                    checked={settings.anonymization}
                    onCheckedChange={value => handleSettingChange('anonymization', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">Zero-Knowledge Mode</div>
                    <div className="text-sm text-muted-foreground">
                      Process archives without storing content data
                    </div>
                  </div>
                  <Switch
                    checked={settings.zeroKnowledgeMode}
                    onCheckedChange={value => handleSettingChange('zeroKnowledgeMode', value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security & Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">Encrypted Storage</div>
                    <div className="text-sm text-muted-foreground">
                      Encrypt temporary files and cache data
                    </div>
                  </div>
                  <Switch
                    checked={settings.encryptedStorage}
                    onCheckedChange={value => handleSettingChange('encryptedStorage', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">Audit Logging</div>
                    <div className="text-sm text-muted-foreground">
                      Maintain detailed logs of all operations
                    </div>
                  </div>
                  <Switch
                    checked={settings.auditLogging}
                    onCheckedChange={value => handleSettingChange('auditLogging', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">GDPR Compliance</div>
                    <div className="text-sm text-muted-foreground">
                      Enable GDPR compliance features
                    </div>
                  </div>
                  <Switch
                    checked={settings.gdprCompliance}
                    onCheckedChange={value => handleSettingChange('gdprCompliance', value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scanning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Scan className="w-5 h-5" />
                  <span>Security Scanning</span>
                </div>
                <Button onClick={startSecurityScan} disabled={isScanning}>
                  {isScanning ? 'Scanning...' : 'Start Scan'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isScanning && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Scanning files for privacy issues...</span>
                    <span>{Math.round(scanProgress)}%</span>
                  </div>
                  <Progress value={scanProgress} />
                </div>
              )}

              {scanResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Scan Results</h3>
                  {scanResults.map((result, index) => (
                    <Card key={index} className="border-l-4 border-l-gray-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">{result.filename}</span>
                          </div>
                          <Badge className={getRiskColor(result.riskLevel)}>
                            {result.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        {result.issues.length > 0 && (
                          <div className="space-y-1">
                            {result.issues.map((issue, issueIndex) => (
                              <div
                                key={issueIndex}
                                className="text-sm text-muted-foreground flex items-center space-x-2"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Audit Trail</span>
                </div>
                <Button onClick={exportAuditLogs} variant="outline" size="sm">
                  Export Audit Logs
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    action: 'Privacy Shield Activated',
                    user: 'System',
                    details: 'All privacy protection features enabled',
                  },
                  {
                    timestamp: new Date(Date.now() - 1000 * 60 * 15),
                    action: 'Security Scan Completed',
                    user: 'User',
                    details: '5 files scanned, 2 issues found',
                  },
                  {
                    timestamp: new Date(Date.now() - 1000 * 60 * 30),
                    action: 'Data Redaction Applied',
                    user: 'System',
                    details: 'Sensitive data redacted in processing logs',
                  },
                ].map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="font-medium">{entry.action}</div>
                      <div className="text-sm text-muted-foreground">{entry.details}</div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{entry.user}</div>
                      <div>{entry.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { name: 'GDPR Compliance', status: true, score: 95 },
                    { name: 'Data Minimization', status: true, score: 88 },
                    { name: 'Consent Management', status: false, score: 65 },
                    { name: 'Data Portability', status: true, score: 92 },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {item.status ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <div className={`text-sm font-medium ${getComplianceColor(item.score)}`}>
                        {item.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Request Data Export
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Eye className="w-4 h-4 mr-2" />
                    View Data Usage
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Data Deletion Request
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Key className="w-4 h-4 mr-2" />
                    Manage Consent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
