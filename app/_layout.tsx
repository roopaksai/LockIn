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
    level: ReanimatedLogLevel.warn,
    strict: false,
  });
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
