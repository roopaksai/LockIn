/**
 * Android implementation of config storage
 * Uses WallpaperModule's SharedPreferences backend
 * File: config-storage.android.ts
 */

import { NativeModules } from 'react-native';
import { IConfigStorage } from './config-storage';

const { WallpaperModule } = NativeModules;

class AndroidConfigStorage implements IConfigStorage {
  /**
   * Save config/progress data via WallpaperModule
   * The native module will save to SharedPreferences
   */
  async save(key: string, value: string): Promise<void> {
    try {
      if (key === 'config') {
        // Parse and save config via WallpaperModule.saveConfig
        const config = JSON.parse(value);
        if (WallpaperModule?.saveConfig) {
          await WallpaperModule.saveConfig(config);
        }
      } else if (key === 'progressData') {
        // Save progress data via WallpaperModule.saveProgressData
        if (WallpaperModule?.saveProgressData) {
          await WallpaperModule.saveProgressData(value);
        }
      } else {
        console.warn(`[AndroidConfigStorage] Unknown key: ${key}`);
      }
    } catch (error) {
      console.error(`[AndroidConfigStorage] Error saving ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load config/progress data via WallpaperModule
   */
  async load(key: string): Promise<string | null> {
    try {
      if (key === 'config') {
        // Load config via WallpaperModule.getConfig
        if (WallpaperModule?.getConfig) {
          const config = await WallpaperModule.getConfig();
          return JSON.stringify(config);
        }
      } else if (key === 'progressData') {
        // Load progress data via WallpaperModule.getProgressData
        if (WallpaperModule?.getProgressData) {
          return await WallpaperModule.getProgressData();
        }
      } else {
        console.warn(`[AndroidConfigStorage] Unknown key: ${key}`);
      }
      return null;
    } catch (error) {
      console.error(`[AndroidConfigStorage] Error loading ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data (best effort)
   */
  async remove(key: string): Promise<void> {
    try {
      // Note: WallpaperModule doesn't have a remove method
      // This is a no-op for now, or could in future call native clear
      console.warn(`[AndroidConfigStorage] Remove not implemented for key: ${key}`);
    } catch (error) {
      console.error(`[AndroidConfigStorage] Error removing ${key}:`, error);
    }
  }
}

// Export the Android implementation
export const configStorage: IConfigStorage = new AndroidConfigStorage();
