/**
 * iOS implementation of config storage
 * Uses native WallpaperModule (UserDefaults with App Group)
 * File: config-storage.ios.ts
 *
 * On iOS, data is stored in UserDefaults via the native WallpaperModule.swift
 * This ensures widgets can access the data via App Group entitlements
 */

import { NativeModules } from 'react-native';
import { IConfigStorage } from './config-storage';

const { WallpaperModule } = NativeModules;

class IOSConfigStorage implements IConfigStorage {
  /**
   * Save config/progress data via native WallpaperModule
   */
  async save(key: string, value: string): Promise<void> {
    try {
      if (key === 'config') {
        const config = JSON.parse(value);
        if (WallpaperModule?.saveConfig) {
          await WallpaperModule.saveConfig(config);
        } else {
          console.warn('[IOSConfigStorage] WallpaperModule.saveConfig not available');
        }
      } else if (key === 'progressData') {
        if (WallpaperModule?.saveProgressData) {
          await WallpaperModule.saveProgressData(value);
        } else {
          console.warn('[IOSConfigStorage] WallpaperModule.saveProgressData not available');
        }
      } else {
        console.warn(`[IOSConfigStorage] Unknown key: ${key}`);
      }

      console.log(`[IOSConfigStorage] Saved ${key}`);
    } catch (error) {
      console.error(`[IOSConfigStorage] Error saving ${key}:`, error);
      throw error;
    }
  }

  /**
   * Load config/progress data via native WallpaperModule
   */
  async load(key: string): Promise<string | null> {
    try {
      if (key === 'config') {
        if (WallpaperModule?.getConfig) {
          const config = await WallpaperModule.getConfig();
          const jsonString = JSON.stringify(config);
          console.log(`[IOSConfigStorage] Loaded ${key}`);
          return jsonString;
        } else {
          console.warn('[IOSConfigStorage] WallpaperModule.getConfig not available');
        }
      } else if (key === 'progressData') {
        if (WallpaperModule?.getProgressData) {
          const data = await WallpaperModule.getProgressData();
          console.log(`[IOSConfigStorage] Loaded ${key}:`, data ? 'found' : 'not found');
          return data;
        } else {
          console.warn('[IOSConfigStorage] WallpaperModule.getProgressData not available');
        }
      } else {
        console.warn(`[IOSConfigStorage] Unknown key: ${key}`);
      }

      return null;
    } catch (error) {
      console.error(`[IOSConfigStorage] Error loading ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data (best effort)
   */
  async remove(key: string): Promise<void> {
    try {
      console.warn(`[IOSConfigStorage] Remove not fully implemented for key: ${key}`);
      // Native module would need to implement a remove method for full support
    } catch (error) {
      console.error(`[IOSConfigStorage] Error removing ${key}:`, error);
    }
  }
}

// Export the iOS implementation
export const configStorage: IConfigStorage = new IOSConfigStorage();
