/**
 * Abstract storage interface for cross-platform config/progress persistence
 * Implementations: config-storage.android.ts, config-storage.ios.ts
 */

export interface IConfigStorage {
  /**
   * Save a string value with a given key
   * @param key The storage key
   * @param value The JSON string to save
   */
  save(key: string, value: string): Promise<void>;

  /**
   * Load a string value by key
   * @param key The storage key
   * @returns The stored value or null if not found
   */
  load(key: string): Promise<string | null>;

  /**
   * Remove a value by key
   * @param key The storage key
   */
  remove(key: string): Promise<void>;
}

// Platform-specific implementation will be imported below
export let configStorage: IConfigStorage;

// This will be overridden by config-storage.android.ts or config-storage.ios.ts
// Default fallback for web or if native implementation fails
const fallbackStorage: IConfigStorage = {
  async save(key: string, value: string): Promise<void> {
    // In memory fallback - not persisted
    console.warn(`[configStorage] Fallback save (not persisted): ${key}`);
  },
  async load(key: string): Promise<string | null> {
    console.warn(`[configStorage] Fallback load (returning null): ${key}`);
    return null;
  },
  async remove(key: string): Promise<void> {
    console.warn(`[configStorage] Fallback remove: ${key}`);
  },
};

// This will be replaced by the platform-specific module
configStorage = fallbackStorage;
