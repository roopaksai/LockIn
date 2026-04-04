import { DEFAULT_CONFIG, WallpaperConfig } from '@/constants/theme';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import { configStorage } from './config-storage';

const { WallpaperModule } = NativeModules;

type WallpaperContextType = {
  config: WallpaperConfig;
  updateConfig: (updates: Partial<WallpaperConfig>) => void;
  saveAndActivate: () => Promise<void>;
  saveConfig: () => Promise<void>;
  isActive: boolean;
  checkActive: () => Promise<void>;
  loading: boolean;
  requestWidgetAdd: () => Promise<boolean>;
  hasActiveWidgets: () => Promise<boolean>;
};

const WallpaperContext = createContext<WallpaperContextType>({
  config: DEFAULT_CONFIG,
  updateConfig: () => {},
  saveAndActivate: async () => {},
  saveConfig: async () => {},
  isActive: false,
  checkActive: async () => {},
  loading: true,
  requestWidgetAdd: async () => false,
  hasActiveWidgets: async () => false,
});

export const useWallpaper = () => useContext(WallpaperContext);

export function WallpaperProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<WallpaperConfig>(DEFAULT_CONFIG);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load saved config via configStorage (platform-agnostic)
  useEffect(() => {
    (async () => {
      try {
        const saved = await configStorage.load('config');
        if (saved) {
          const parsed = JSON.parse(saved);
          setConfig({
            mode: parsed.mode || 'year',
            goalTitle: parsed.goalTitle || '',
            targetDays: parsed.targetDays ?? 0,
            backgroundColor: parsed.backgroundColor || '#000000',
            completedColor: parsed.completedColor || '#FFFFFF',
            currentColor: parsed.currentColor || '#FF8C00',
            remainingColor: parsed.remainingColor || '#4A4A4A',
            customStartDate: parsed.customStartDate,
          });
        }
      } catch (e) {
        console.warn('Failed to load config:', e);
        // Use defaults
      }
      setLoading(false);
    })();
  }, []);

  const checkActive = useCallback(async () => {
    try {
      if (WallpaperModule?.isWallpaperActive) {
        const active = await WallpaperModule.isWallpaperActive();
        setIsActive(active);
      }
    } catch {
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    checkActive();
  }, [checkActive]);

  // Auto-save config whenever it changes (after first load)
  useEffect(() => {
    if (!loading) {
      (async () => {
        try {
          await configStorage.save('config', JSON.stringify(config));
        } catch (e) {
          console.warn('Failed to auto-save config:', e);
        }
      })();
    }
  }, [config, loading]);

  const updateConfig = useCallback((updates: Partial<WallpaperConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      // When switching to custom mode or entering custom days, set start date to today if not already set
      if (next.mode === 'custom' && next.targetDays > 0 && !next.customStartDate) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        next.customStartDate = `${year}-${month}-${day}`;
      }
      return next;
    });
  }, []);

  const saveConfig = useCallback(async () => {
    try {
      await configStorage.save('config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed to save config:', e);
      throw e;
    }
  }, [config]);

  const saveAndActivate = useCallback(async () => {
    try {
      // Save config via platform-agnostic storage
      await configStorage.save('config', JSON.stringify(config));

      // Activate wallpaper (Android-only, gracefully fails on iOS)
      if (WallpaperModule?.activateWallpaper) {
        await WallpaperModule.activateWallpaper();
      }

      // Check active after a delay (user needs to confirm in system picker)
      setTimeout(() => checkActive(), 3000);
    } catch (e) {
      console.warn('Failed to activate wallpaper:', e);
      throw e;
    }
  }, [config, checkActive]);

  const requestWidgetAdd = useCallback(async (): Promise<boolean> => {
    try {
      // Save config first so the widget renders current settings
      await configStorage.save('config', JSON.stringify(config));

      if (WallpaperModule?.requestWidgetAdd) {
        return await WallpaperModule.requestWidgetAdd();
      }
      return false;
    } catch (e) {
      console.warn('Failed to add widget:', e);
      return false;
    }
  }, [config]);

  const hasActiveWidgets = useCallback(async (): Promise<boolean> => {
    try {
      if (WallpaperModule?.hasActiveWidgets) {
        return await WallpaperModule.hasActiveWidgets();
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return (
    <WallpaperContext.Provider
      value={{
        config,
        updateConfig,
        saveAndActivate,
        saveConfig,
        isActive,
        checkActive,
        loading,
        requestWidgetAdd,
        hasActiveWidgets,
      }}>
      {children}
    </WallpaperContext.Provider>
  );
}
