import { DataSourcePlugin } from '../datasources/base/types';

export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, DataSourcePlugin> = new Map();
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize all registered plugins
    const plugins = Array.from(this.plugins.values());
    for (const plugin of plugins) {
      try {
        await plugin.initialize();
      } catch (error) {
        console.error(`Failed to initialize plugin ${plugin.name}:`, error);
      }
    }

    this.initialized = true;
  }

  async cleanup(): Promise<void> {
    // Cleanup all registered plugins
    const plugins = Array.from(this.plugins.values());
    for (const plugin of plugins) {
      try {
        await plugin.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup plugin ${plugin.name}:`, error);
      }
    }

    this.plugins.clear();
    this.initialized = false;
  }

  registerPlugin(plugin: DataSourcePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name ${plugin.name} already registered`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  unregisterPlugin(name: string): void {
    this.plugins.delete(name);
  }

  getPlugin(name: string): DataSourcePlugin | undefined {
    return this.plugins.get(name);
  }

  getPluginsByType(type: string): DataSourcePlugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.type === type);
  }

  listPlugins(): DataSourcePlugin[] {
    return Array.from(this.plugins.values());
  }
} 