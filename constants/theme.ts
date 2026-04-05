/**
 * LockIn — Grey futuristic minimalist theme
 * 8-point spacing system
 */

export const AppTheme = {
  colors: {
    // Backgrounds
    background: '#0A0A0A',
    surface: '#141414',
    surfaceLight: '#1E1E1E',
    surfaceLighter: '#2A2A2A',
    surfaceHighlight: '#333333',

    // Text
    text: '#E0E0E0',
    textSecondary: '#999999',
    textMuted: '#666666',
    textDim: '#444444',

    // Wallpaper cell colors
    accent: '#FF8C00',       // current day (orange)
    completed: '#FFFFFF',    // past days (white)
    remaining: '#4A4A4A',   // future days (grey)

    // UI
    border: '#2A2A2A',
    borderLight: '#383838',
    tabBar: '#0F0F0F',
    tabActive: '#FF8C00',
    tabInactive: '#555555',

    // Status
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#EF4444',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },

  // Background presets for wallpaper
  backgroundPresets: [
    { label: 'AMOLED Black', value: '#000000' },
    { label: 'Charcoal',     value: '#121212' },
    { label: 'Dark Grey',    value: '#1A1A1A' },
    { label: 'Deep Navy',    value: '#0A0F1A' },
    { label: 'Obsidian',     value: '#0D0D0D' },
  ] as const,
};

/**
 * Lock screen safe zone — fraction of screen height where NO system UI
 * (clock, date, widgets, gesture bar, lock controls) renders.
 *
 * Researched across: Pixel (Android 12–15 Material You), Samsung One UI 5–6,
 * Xiaomi MIUI 14 / HyperOS, OnePlus OxygenOS 13–14, iPhone iOS 16–18.
 *
 * Worst-case assumption: large clock, zero notifications.
 *
 * SAFE_TOP   0.35 — below all OEM clock/date/weather (Pixel default, Samsung,
 *                    Xiaomi, OnePlus all end ≤ 0.35; Pixel "Flex" two-line clock
 *                    can reach ~0.45 but is non-default and rarely used).
 * SAFE_BOTTOM 0.87 — above OnePlus fingerprint indicator (lowest at ~0.83),
 *                    Samsung/Xiaomi shortcuts (~0.89), and gesture bar (~0.96).
 *
 * When showTime is true the app renders its own clock at 0.08–0.17
 * (intentionally co-located with the system clock area).
 */
export const LockScreenSafeZone = {
  /** Fraction of screen height below which no system clock/date renders */
  SAFE_TOP: 0.35,
  /** Fraction of screen height above which no lock controls / gesture bar */
  SAFE_BOTTOM: 0.87,

  /* Recommended element positions within the safe zone (fractions of height) */
  TITLE_Y: 0.33,        // title text top
  GRID_TOP_Y: 0.37,     // dot-grid top edge
  GRID_BOTTOM_Y: 0.79,  // dot-grid bottom edge (max)
  LABEL_Y: 0.84,        // "days remaining" label
} as const;

// Legacy Colors export for compatibility
export const Colors = {
  light: {
    text: AppTheme.colors.text,
    background: AppTheme.colors.background,
    tint: AppTheme.colors.accent,
    icon: AppTheme.colors.textMuted,
    tabIconDefault: AppTheme.colors.tabInactive,
    tabIconSelected: AppTheme.colors.tabActive,
  },
  dark: {
    text: AppTheme.colors.text,
    background: AppTheme.colors.background,
    tint: AppTheme.colors.accent,
    icon: AppTheme.colors.textMuted,
    tabIconDefault: AppTheme.colors.tabInactive,
    tabIconSelected: AppTheme.colors.tabActive,
  },
};

export type WallpaperConfig = {
  mode: 'year' | 'custom';
  goalTitle: string;
  targetDays: number;        // number of days for custom countdown
  backgroundColor: string;   // hex
  completedColor: string;    // hex
  currentColor: string;      // hex
  remainingColor: string;    // hex
  customStartDate?: string;  // YYYY-MM-DD when custom countdown started
};

export const DEFAULT_CONFIG: WallpaperConfig = {
  mode: 'year',
  goalTitle: '',
  targetDays: 0,
  backgroundColor: '#000000',
  completedColor: '#FFFFFF',
  currentColor: '#FF8C00',
  remainingColor: '#4A4A4A',
  customStartDate: undefined,
};

/* ─── Progress mode types ────────────────────────────────────────── */

export type DayLog = {
  completed: string[];
  total: number;
};

export type ProgressConfig = {
  enabled: boolean;
  tasks: string[];
  dailyLog: Record<string, DayLog>; // key: "YYYY-MM-DD"
  reminderHour: number;
  reminderMinute: number;
};

export const DEFAULT_PROGRESS: ProgressConfig = {
  enabled: false,
  tasks: [],
  dailyLog: {},
  reminderHour: 21,
  reminderMinute: 0,
};
