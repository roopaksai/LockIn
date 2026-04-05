import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';
import { ProgressProvider } from '@/contexts/progress-context';
import { WallpaperProvider } from '@/contexts/wallpaper-context';

// Force dark theme with our custom colors
const LockInTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: AppTheme.colors.accent,
    background: AppTheme.colors.background,
    card: AppTheme.colors.surface,
    text: AppTheme.colors.text,
    border: AppTheme.colors.border,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

if (__DEV__) {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.error,
    strict: false,
  });

  const reanimatedInlineStyleWarning =
    "It looks like you might be using shared value's .value inside reanimated inline style.";

  const runtime = globalThis as { __lockinWarnPatchApplied?: boolean };
  if (!runtime.__lockinWarnPatchApplied) {
    const originalWarn = console.warn as (...args: unknown[]) => void;
    console.warn = ((...args: unknown[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && firstArg.includes(reanimatedInlineStyleWarning)) {
        return;
      }
      originalWarn(...args);
    }) as typeof console.warn;
    runtime.__lockinWarnPatchApplied = true;
  }
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={LockInTheme}>
          <WallpaperProvider>
            <ProgressProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <StatusBar style="light" />
            </ProgressProvider>
          </WallpaperProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
