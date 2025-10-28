// Enhanced types for ZIPWizard v2.2.6b
export interface SymbolicThread {
  id: string;
  chainId: string;
  version: string;
  from: string;
  to: string;
  operation: string;
  timestamp: Date;
  ethicsLock?: string;
  trustAnchor?: string;
}

export interface MutationTracker {
  fileId: string;
  originalHash: string;
  currentHash: string;
  mutations: FileMutation[];
  lastModified: Date;
}

export interface FileMutation {
  id: string;
  type: 'content' | 'metadata' | 'structure';
  description: string;
  timestamp: Date;
  author?: string;
  delta?: any;
}

export interface ObserverEvent {
  id: string;
  type: 'upload' | 'analysis' | 'mutation' | 'export' | 'access';
  target: string;
  metadata: Record<string, any>;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
}

export interface SecurityContext {
  ethicsLock: string;
  trustAnchor: string;
  verified: boolean;
  validUntil?: Date;
}

export interface ArchiveMetadata {
  symbolicThread?: SymbolicThread;
  securityContext?: SecurityContext;
  replayable: boolean;
  continuityAnchors?: string[];
  monitoringWindow?: number;
}
