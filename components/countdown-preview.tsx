import { AppTheme, LockScreenSafeZone, WallpaperConfig } from '@/constants/theme';
import { useProgress } from '@/contexts/progress-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

type Props = {
  config: WallpaperConfig;
  showProgress?: boolean; // Control whether to show progress coloring
};

type DayInfoConfig = Pick<WallpaperConfig, 'mode' | 'targetDays' | 'customStartDate'>;

/* ─── Day-count helpers ──────────────────────────────────────────── */

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayInfo(config: DayInfoConfig, now: Date) {
  if (config.mode === 'year') {
    const year = now.getFullYear();
    const totalDays = isLeapYear(year) ? 366 : 365;
    const startOfYear = new Date(year, 0, 1);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
    const daysRemaining = totalDays - dayOfYear;
    return { dayOfYear, totalDays, daysRemaining };
  }

  // Custom mode — use start date if available
  if (config.targetDays <= 0) {
    return { dayOfYear: 0, totalDays: 0, daysRemaining: 0 };
  }

  const totalDays = config.targetDays;
  let dayOfYear = 1;

  if (config.customStartDate) {
    const [year, month, day] = config.customStartDate.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    const diff = now.getTime() - startDate.getTime();
    const daysElapsed = Math.floor(diff / (1000 * 60 * 60 * 24));
    dayOfYear = Math.max(1, Math.min(daysElapsed + 1, totalDays));
  }

  const daysRemaining = totalDays - dayOfYear;
  return { dayOfYear, totalDays, daysRemaining };
}

/* ─── Pulsing dot for "today" ────────────────────────────────────── */

function PulsingDot({ size, color }: { size: number; color: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale]);

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: 2 - scale.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

type GridDotProps = {
  size: number;
  color: string;
  pulse: boolean;
};

function GridDot({
  size,
  color,
  pulse,
}: GridDotProps) {
  if (pulse) {
    return <PulsingDot size={size} color={color} />;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  );
}

/* ─── Main preview ───────────────────────────────────────────────── */

/** Linearly interpolate between two hex colors by ratio (0‑1). */
function lerpColor(from: string, to: string, ratio: number): string {
  const r = Math.max(0, Math.min(1, ratio));
  const f = parseInt(from.slice(1), 16);
  const t = parseInt(to.slice(1), 16);
  const fR = (f >> 16) & 0xff, fG = (f >> 8) & 0xff, fB = f & 0xff;
  const tR = (t >> 16) & 0xff, tG = (t >> 8) & 0xff, tB = t & 0xff;
  const rR = Math.round(fR + (tR - fR) * r);
  const rG = Math.round(fG + (tG - fG) * r);
  const rB = Math.round(fB + (tB - fB) * r);
  return `#${((rR << 16) | (rG << 8) | rB).toString(16).padStart(6, '0')}`;
}

/** Get the YYYY-MM-DD key for the Nth day-of-year (1-based). */
function dateKeyForDay(dayOfYear: number, year: number): string {
  const d = new Date(year, 0, dayOfYear); // month=0, day=dayOfYear
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function CountdownPreview({ config, showProgress = false }: Props) {
  const { progress } = useProgress();
  const { width: screenWidth } = useWindowDimensions();
  const badgePulse = useSharedValue(0);
  const previewWidth = screenWidth - AppTheme.spacing.lg * 2;
  const previewHeight = previewWidth * 1.95;

  // Live clock — update every 30 s
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { dayOfYear, totalDays, daysRemaining } = useMemo(
    () =>
      getDayInfo(
        {
          mode: config.mode,
          targetDays: config.targetDays,
          customStartDate: config.customStartDate,
        },
        now,
      ),
    [config.mode, config.targetDays, config.customStartDate, now],
  );

  /* ── Grid math ── */
  const gridWidthFraction = 0.88;
  const gridWidth = previewWidth * gridWidthFraction;
  const titleFontSize = previewHeight * 0.017;
  const trimmedTitle = config.goalTitle.trim();
  const titleLetterSpacing =
    trimmedTitle.length > 20 ? 3.5 : trimmedTitle.length > 14 ? 4.5 : 6;

  const cols =
    totalDays <= 50
      ? 7
      : totalDays <= 100
        ? 10
        : totalDays <= 200
          ? 15
          : totalDays <= 300
            ? 18
            : 19;

  const cellW = gridWidth / cols;
  const cellH = cellW; // square cells
  const dotSize = cellW * 0.55;

  const percentComplete =
    totalDays > 0 ? Math.round((dayOfYear / totalDays) * 100) : 0;
  const isFullyComplete = totalDays > 0 && dayOfYear >= totalDays;
  const isCustomComplete = config.mode === 'custom' && isFullyComplete;

  useEffect(() => {
    if (isCustomComplete) {
      badgePulse.value = withRepeat(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      return;
    }

    badgePulse.value = 0;
  }, [badgePulse, isCustomComplete]);

  const completionBadgeAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 0.84 + badgePulse.value * 0.16,
      transform: [{ scale: 1 + badgePulse.value * 0.015 }],
    };
  });

  /* ── Vertical offsets — top 35% left for system clock ── */
  const titleTop = previewHeight * LockScreenSafeZone.TITLE_Y;
  const gridTop = previewHeight * LockScreenSafeZone.GRID_TOP_Y;
  const effectiveGridTop = isCustomComplete ? gridTop + previewHeight * 0.035 : gridTop;
  const labelBottom = previewHeight * (1 - LockScreenSafeZone.LABEL_Y);

  return (
    <View style={[styles.previewFrame, { width: previewWidth, height: previewHeight }]}> 
      <View
        accessible
        accessibilityLabel={`Countdown preview. ${percentComplete}% complete, ${daysRemaining} days remaining`}
        accessibilityRole="image"
        style={[
          styles.container,
          {
            width: previewWidth,
            height: previewHeight,
            backgroundColor: config.backgroundColor,
          },
        ]}>

        <View pointerEvents="none" style={styles.topGlow} />
        <View pointerEvents="none" style={styles.bottomShade} />

        {/* ── Title ── */}
        {config.goalTitle ? (
          <Text
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            ellipsizeMode="tail"
            style={[
              styles.titleText,
              {
                top: titleTop,
                width: gridWidth,
                fontSize: titleFontSize,
                letterSpacing: titleLetterSpacing,
              },
            ]}>
            {trimmedTitle.toUpperCase()}
          </Text>
        ) : (
          <Text
            style={[
              styles.emptyTitle,
              { top: titleTop, width: gridWidth },
            ]}>
            SET YOUR MISSION
          </Text>
        )}

        {isCustomComplete && (
          <Animated.View
            style={[
              styles.completionBadge,
              {
                top: titleTop + previewHeight * 0.06,
                width: gridWidth * 0.74,
              },
              completionBadgeAnimStyle,
            ]}>
            <Text style={[styles.completionBadgeText, { fontSize: previewHeight * 0.0115 }]}>MISSION COMPLETED</Text>
          </Animated.View>
        )}

        {/* ── Dot grid ── */}
        {totalDays > 0 && (
          <View
            style={[
              styles.gridContainer,
              { top: effectiveGridTop, width: gridWidth },
            ]}>
            <View style={styles.gridWrap}>
              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const isCurrent = day === dayOfYear;
                const isCompleted = day < dayOfYear;

                let dotColor: string;
                if (isFullyComplete) {
                  dotColor = AppTheme.colors.success;
                } else if (isCurrent) {
                  dotColor = config.currentColor;
                } else if (isCompleted) {
                  if (showProgress && config.mode === 'year') {
                    // Progress mode: shade by completion ratio (light gray to white, GitHub-style)
                    const year = now.getFullYear();
                    const key = dateKeyForDay(day, year);
                    const log = progress.dailyLog[key];
                    const lightGray = '#F0F0F0';
                    const whiteColor = '#FFFFFF';
                    if (log && log.total > 0) {
                      const ratio = log.completed.length / log.total;
                      dotColor = lerpColor(lightGray, whiteColor, ratio);
                    } else {
                      dotColor = lightGray;
                    }
                  } else {
                    dotColor = config.completedColor;
                  }
                } else {
                  dotColor = config.remainingColor;
                }

                return (
                  <View
                    key={i}
                    style={{
                      width: cellW,
                      height: cellH,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <GridDot
                      size={dotSize}
                      color={dotColor}
                      pulse={isCurrent && !isFullyComplete}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Days remaining label ── */}
        <View style={[styles.labelContainer, { bottom: labelBottom }]}>
          <Text
            style={[
              styles.labelText,
              { fontSize: previewHeight * 0.013 },
            ]}>
            {isCustomComplete ? 'MISSION COMPLETE  ·  100%' : `${daysRemaining} DAYS LEFT  ·  ${percentComplete}%`}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  previewFrame: {
    borderRadius: AppTheme.borderRadius.lg + 2,
    borderWidth: 1,
    borderColor: '#2C2C2C',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 12,
  },
  container: {
    borderRadius: AppTheme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#232323',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '24%',
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  bottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '26%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  titleText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'HelveticaNeue-Medium',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  completionBadge: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.65)',
    backgroundColor: 'rgba(35,104,44,0.45)',
    paddingVertical: 6,
  },
  completionBadgeText: {
    textAlign: 'center',
    color: '#D7FFD9',
    letterSpacing: 2.2,
    fontWeight: '700',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'HelveticaNeue-Medium',
  },
  emptyTitle: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#555555',
    fontSize: 14,
    letterSpacing: 5,
    fontWeight: '600',
    fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia',
    fontStyle: 'italic',
  },
  gridContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  labelContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  labelText: {
    color: '#A3A3A3',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'android' ? 'sans-serif-medium' : 'HelveticaNeue-Medium',
  },
});
