/**
 * Plugin Registry System
 * 
 * Provides extensible plugin architecture for:
 * - Security scanners
 * - File format handlers
 * - Notification channels
 * - Authentication providers
 * - Policy engines
 * 
 * Plugins can be registered at runtime and are automatically integrated
 * into the security and processing pipeline.
 */

import { auditLog } from './audit-log';

export type PluginType = 
  | 'scanner'
  | 'format-handler'
  | 'notification-channel'
  | 'auth-provider'
  | 'policy-engine'
  | 'validator';

/**
 * Helper function to format error messages consistently
 */
function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  description: string;
  author: string;
  enabled: boolean;
  priority?: number; // Lower number = higher priority
  dependencies?: string[]; // Plugin IDs this plugin depends on
}

export interface Plugin<T = unknown> {
  metadata: PluginMetadata;
  initialize(): Promise<void>;
  execute(context: T): Promise<unknown>;
  cleanup?(): Promise<void>;
  healthCheck?(): Promise<boolean>;
}

export interface ScannerPlugin extends Plugin<ScannerContext> {
  metadata: PluginMetadata & { type: 'scanner' };
  scan(files: any[]): Promise<ScanResult[]>;
}

export interface ScannerContext {
  files: any[];
  options?: Record<string, any>;
}

export interface ScanResult {
  pluginId: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  type: string;
  file: string;
  line?: number;
  description: string;
  fix?: string;
  references?: string[];
}

export interface FormatHandlerPlugin extends Plugin<FormatContext> {
  metadata: PluginMetadata & { type: 'format-handler' };
  canHandle(filename: string, mimeType?: string): boolean;
  parse(content: Buffer | string): Promise<any>;
  analyze?(parsed: any): Promise<any>;
}

export interface FormatContext {
  filename: string;
  content: Buffer | string;
  mimeType?: string;
  options?: Record<string, any>;
}

export interface NotificationChannelPlugin extends Plugin<NotificationContext> {
  metadata: PluginMetadata & { type: 'notification-channel' };
  send(notification: any): Promise<void>;
}

export interface NotificationContext {
  notification: any;
  config?: Record<string, any>;
}

class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private pluginsByType: Map<PluginType, Set<string>> = new Map();
  private initializationOrder: string[] = [];

  /**
   * Register a new plugin
   */
  async register(plugin: Plugin): Promise<void> {
    const { id, type, dependencies = [] } = plugin.metadata;

    // Check if plugin already registered
    if (this.plugins.has(id)) {
      throw new Error(`Plugin '${id}' is already registered`);
    }

    // Verify dependencies
    for (const depId of dependencies) {
      if (!this.plugins.has(depId)) {
        throw new Error(`Plugin '${id}' depends on missing plugin '${depId}'`);
      }
    }

    // Add to registry
    this.plugins.set(id, plugin);

    // Index by type
    if (!this.pluginsByType.has(type)) {
      this.pluginsByType.set(type, new Set());
    }
    this.pluginsByType.get(type)!.add(id);

    // Initialize plugin
    try {
      await plugin.initialize();
      this.initializationOrder.push(id);

      // Log registration
      await auditLog.log('info', 'system', 'Plugin registered', {
        details: {
          pluginId: id,
          pluginName: plugin.metadata.name,
          pluginType: type,
          pluginVersion: plugin.metadata.version
        }
      });

      console.log(`✅ Plugin registered: ${plugin.metadata.name} v${plugin.metadata.version}`);
    } catch (error) {
      // Remove from registry if initialization fails
      this.plugins.delete(id);
      this.pluginsByType.get(type)?.delete(id);

      await auditLog.log('critical', 'system', 'Plugin registration failed', {
        details: {
          pluginId: id,
          error: formatError(error)
        }
      });

      throw new Error(`Failed to initialize plugin '${id}': ${formatError(error)}`);
    }
  }

  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // Check if other plugins depend on this one
    const dependents = Array.from(this.plugins.values())
      .filter(p => p.metadata.dependencies?.includes(pluginId));

    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister plugin '${pluginId}'. Other plugins depend on it: ${
          dependents.map(p => p.metadata.name).join(', ')
        }`
      );
    }

    // Cleanup
    if (plugin.cleanup) {
      await plugin.cleanup();
    }

    // Remove from registry
    this.plugins.delete(pluginId);
    this.pluginsByType.get(plugin.metadata.type)?.delete(pluginId);
    this.initializationOrder = this.initializationOrder.filter(id => id !== pluginId);

    // Log unregistration
    await auditLog.log('info', 'system', 'Plugin unregistered', {
      details: {
        pluginId,
        pluginName: plugin.metadata.name
      }
    });

    console.log(`❌ Plugin unregistered: ${plugin.metadata.name}`);
  }

  /**
   * Get plugin by ID
   */
  get<T extends Plugin = Plugin>(pluginId: string): T | undefined {
    return this.plugins.get(pluginId) as T | undefined;
  }

  /**
   * Get all plugins of a specific type
   */
  getByType<T extends Plugin = Plugin>(type: PluginType): T[] {
    const pluginIds = this.pluginsByType.get(type) || new Set();
    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((p): p is T => p !== undefined && p.metadata.enabled)
      .sort((a, b) => (a.metadata.priority || 100) - (b.metadata.priority || 100));
  }

  /**
   * Get all scanner plugins
   */
  getScanners(): ScannerPlugin[] {
    return this.getByType<ScannerPlugin>('scanner');
  }

  /**
   * Get all format handler plugins
   */
  getFormatHandlers(): FormatHandlerPlugin[] {
    return this.getByType<FormatHandlerPlugin>('format-handler');
  }

  /**
   * Get all notification channel plugins
   */
  getNotificationChannels(): NotificationChannelPlugin[] {
    return this.getByType<NotificationChannelPlugin>('notification-channel');
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    plugin.metadata.enabled = true;

    await auditLog.log('info', 'system', 'Plugin enabled', {
      details: { pluginId, pluginName: plugin.metadata.name }
    });
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    plugin.metadata.enabled = false;

    await auditLog.log('info', 'system', 'Plugin disabled', {
      details: { pluginId, pluginName: plugin.metadata.name }
    });
  }

  /**
   * Run health checks on all plugins
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const pluginEntries = Array.from(this.plugins.entries());
    for (const [id, plugin] of pluginEntries) {
      if (!plugin.metadata.enabled) continue;

      try {
        const healthy = plugin.healthCheck ? await plugin.healthCheck() : true;
        results.set(id, healthy);

        if (!healthy) {
          await auditLog.log('warning', 'system', 'Plugin health check failed', {
            details: { pluginId: id, pluginName: plugin.metadata.name }
          });
        }
      } catch (error) {
        results.set(id, false);
        await auditLog.log('critical', 'system', 'Plugin health check error', {
          details: {
            pluginId: id,
            error: formatError(error)
          }
        });
      }
    }

    return results;
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    total: number;
    enabled: number;
    byType: Record<PluginType, number>;
    plugins: Array<{
      id: string;
      name: string;
      type: PluginType;
      version: string;
      enabled: boolean;
    }>;
  } {
    const plugins = Array.from(this.plugins.values());
    const byType: Partial<Record<PluginType, number>> = {};

    plugins.forEach(p => {
      byType[p.metadata.type] = (byType[p.metadata.type] || 0) + 1;
    });

    return {
      total: plugins.length,
      enabled: plugins.filter(p => p.metadata.enabled).length,
      byType: byType as Record<PluginType, number>,
      plugins: plugins.map(p => ({
        id: p.metadata.id,
        name: p.metadata.name,
        type: p.metadata.type,
        version: p.metadata.version,
        enabled: p.metadata.enabled
      }))
    };
  }

  /**
   * Execute all plugins of a type in priority order
   */
  async executeAll<T extends Plugin>(
    type: PluginType,
    context: any
  ): Promise<Array<{ pluginId: string; result: any; error?: Error }>> {
    const plugins = this.getByType<T>(type);
    const results: Array<{ pluginId: string; result: any; error?: Error }> = [];

    for (const plugin of plugins) {
      try {
        const result = await plugin.execute(context);
        results.push({ pluginId: plugin.metadata.id, result });
      } catch (error) {
        results.push({
          pluginId: plugin.metadata.id,
          result: null,
          error: error instanceof Error ? error : new Error('Unknown error')
        });

        await auditLog.log('warning', 'system', 'Plugin execution failed', {
          details: {
            pluginId: plugin.metadata.id,
            error: formatError(error)
          }
        });
      }
    }

    return results;
  }

  /**
   * List all registered plugins
   */
  list(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();

/**
 * Helper to create a basic plugin
 */
export function createPlugin<T = unknown>(
  metadata: PluginMetadata,
  executor: (context: T) => Promise<unknown>,
  initializer?: () => Promise<void>,
  cleaner?: () => Promise<void>
): Plugin<T> {
  return {
    metadata,
    initialize: initializer || (async () => {}),
    execute: executor,
    cleanup: cleaner,
    healthCheck: async () => true
  };
}
