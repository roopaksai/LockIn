import CountdownPreview from '@/components/countdown-preview';
import { AppTheme } from '@/constants/theme';
import { configStorage } from '@/contexts/config-storage';
import { useProgress } from '@/contexts/progress-context';
import { useWallpaper } from '@/contexts/wallpaper-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ─── Normal Tab ─────────────────────────────────────────────────── */

function NormalTab() {
  const { config, updateConfig, saveAndActivate, isActive, checkActive, requestWidgetAdd, hasActiveWidgets } =
    useWallpaper();
  const { progress, setEnabled } = useProgress();
  const [widgetActive, setWidgetActive] = React.useState(false);
  const [customDaysInput, setCustomDaysInput] = useState(config.targetDays ? String(config.targetDays) : '');
  const goalTitleLength = config.goalTitle.trim().length;

  useEffect(() => {
    setCustomDaysInput(config.targetDays ? String(config.targetDays) : '');
  }, [config.targetDays]);

  useFocusEffect(
    useCallback(() => {
      checkActive();
      hasActiveWidgets().then(setWidgetActive).catch(() => {});
    }, [checkActive, hasActiveWidgets])
  );

  const handleActivate = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      // Ensure progress mode is disabled when setting wallpaper from Normal tab
      // Save directly with enabled=false (don't rely on async state update)
      const updated = { ...progress, enabled: false };
      setEnabled(false);
      await configStorage.save('progressData', JSON.stringify(updated));

      // Now save wallpaper config and activate
      await saveAndActivate();
    } catch {
      Alert.alert('Error', 'Failed to set live wallpaper. Please try again.');
    }
  };

  const handleAddWidget = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const added = await requestWidgetAdd();
    if (!added) {
      Alert.alert(
        'Widget',
        Number(Platform.Version) >= 26
          ? 'Could not add widget. Your launcher may not support pinned widgets.'
          : 'Widgets require Android 8.0+. Long-press your home screen to add manually.'
      );
    } else {
      setTimeout(() => hasActiveWidgets().then(setWidgetActive).catch(() => {}), 3000);
    }
  };

  const handleDaysInput = (text: string) => {
    setCustomDaysInput(text.replace(/[^0-9]/g, ''));
  };

  const commitCustomDays = () => {
    const nextDays = customDaysInput ? parseInt(customDaysInput, 10) : 0;
    const prevDays = config.targetDays;

    if (Number.isNaN(nextDays) || nextDays === prevDays) {
      return;
    }

    if (nextDays <= 0) {
      updateConfig({ targetDays: 0 });
      return;
    }

    const hasExistingCustomProgress =
      config.mode === 'custom' && prevDays > 0 && Boolean(config.customStartDate);

    if (!hasExistingCustomProgress) {
      updateConfig({ targetDays: nextDays });
      return;
    }

    Alert.alert('Update Custom Countdown', 'Choose how to apply your new day count.', [
      {
        text: 'Edit current',
        onPress: () => updateConfig({ targetDays: nextDays }),
      },
      {
        text: 'New progress',
        onPress: () =>
          updateConfig({
            targetDays: nextDays,
            customStartDate: formatDateKey(new Date()),
          }),
      },
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => setCustomDaysInput(prevDays ? String(prevDays) : ''),
      },
    ]);
  };

  const handleModeChange = (mode: 'year' | 'custom') => {
    if (mode === 'custom' && progress.enabled) {
      Alert.alert('Progress Mode Uses Full Year', 'Disable Progress Mode to use Custom Days countdown.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updates: Partial<Record<string, string | number>> = { mode };
    if (mode === 'year') {
      updates.targetDays = 0;
    }
    updateConfig(updates);
  };

  return (
    <>
      {/* Preview */}
      <View style={styles.previewWrapper}>
        <CountdownPreview config={config} showProgress={false} />
      </View>

      {/* Status Indicator */}
      <View style={styles.statusRow} accessible accessibilityLabel={isActive ? 'Wallpaper is active' : 'Wallpaper is not set'}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isActive ? AppTheme.colors.success : AppTheme.colors.textMuted },
          ]}
        />
        <Text style={styles.statusText}>
          {isActive ? 'Wallpaper active' : 'Wallpaper not set'}
        </Text>
      </View>

      {/* Goal Title Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>GOAL TITLE</Text>
        <TextInput
          style={styles.input}
          value={config.goalTitle}
          onChangeText={(text) => updateConfig({ goalTitle: text })}
          placeholder="e.g. JEE 2026, Year Progress"
          placeholderTextColor={AppTheme.colors.textDim}
          maxLength={24}
          accessibilityLabel="Goal title input"
        />
        <Text style={styles.inputHint}>{goalTitleLength}/24 characters · Short titles fit better on lock screen.</Text>
      </View>

      {/* Mode Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>COUNTDOWN MODE</Text>
        <View style={styles.modeRow}>
          <Pressable
            style={({ pressed }) => [
              styles.modeButton,
              config.mode === 'year' && styles.modeButtonActive,
              pressed && styles.modeButtonPressed,
            ]}
            onPress={() => handleModeChange('year')}
            accessibilityRole="button">
            <Text style={[styles.modeButtonText, config.mode === 'year' && styles.modeButtonTextActive]}>
              FULL YEAR
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.modeButton,
              config.mode === 'custom' && styles.modeButtonActive,
              pressed && styles.modeButtonPressed,
            ]}
            onPress={() => handleModeChange('custom')}
            accessibilityRole="button">
            <Text style={[styles.modeButtonText, config.mode === 'custom' && styles.modeButtonTextActive]}>
              CUSTOM DAYS
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Custom Days Input */}
      {config.mode === 'custom' && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NUMBER OF DAYS</Text>
          <TextInput
            style={styles.input}
            value={customDaysInput}
            onChangeText={handleDaysInput}
            onEndEditing={commitCustomDays}
            placeholder="e.g. 90, 180, 365"
            placeholderTextColor={AppTheme.colors.textDim}
            keyboardType="number-pad"
            maxLength={4}
          />
          <Text style={styles.inputHint}>If countdown already started, you can choose Edit current or New progress.</Text>
        </View>
      )}

      {/* Set Wallpaper Button */}
      <TouchableOpacity
        style={styles.activateButton}
        onPress={handleActivate}
        accessibilityRole="button">
        <Text style={styles.activateButtonText}>SET AS LIVE WALLPAPER</Text>
      </TouchableOpacity>

      {/* Widget Section */}
      {Platform.OS === 'android' && (
        <View style={styles.widgetSection}>
          <View style={styles.widgetHeader}>
            <Text style={styles.sectionLabel}>HOME SCREEN WIDGET</Text>
            <View style={styles.widgetStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: widgetActive ? AppTheme.colors.success : AppTheme.colors.textMuted },
                ]}
              />
              <Text style={styles.widgetStatusText}>
                {widgetActive ? 'Widget active' : 'No widget'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.widgetButton}
            onPress={handleAddWidget}
            accessibilityRole="button">
            <Text style={styles.widgetButtonText}>ADD TO HOME SCREEN</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

/* ─── Progress Mode Tab ──────────────────────────────────────────── */

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

function ProgressModeTab() {
  const { progress, addTask, removeTask, toggleTaskDone, setReminderTime, setEnabled, save } =
    useProgress();
  const { config, updateConfig } = useWallpaper();
  const [newTask, setNewTask] = useState('');
  const [showSetup, setShowSetup] = useState(true);

  const todayKey = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const todayLog = progress.dailyLog[todayKey] || { completed: [], total: progress.tasks.length };
  const todayDone = todayLog.completed.length;
  const todayTotal = progress.tasks.length;
  const todayPercent = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  useEffect(() => {
    if (progress.enabled && config.mode !== 'year') {
      updateConfig({ mode: 'year' });
    }
  }, [progress.enabled, config.mode, updateConfig]);

  const handleAddTask = () => {
    if (newTask.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      addTask(newTask.trim());
      setNewTask('');
    }
  };

  const handleRemoveTask = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeTask(title);
  };

  const handleToggle = (title: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTaskDone(title);
  };

  const handleProgressToggle = (value: boolean) => {
    if (value && config.mode !== 'year') {
      updateConfig({ mode: 'year' });
    }

    setEnabled(value);

    if (value) {
      setShowSetup(true);
    }
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await save();
      setShowSetup(false);
      Alert.alert('Saved', 'Progress mode settings saved. Wallpaper & widget will update.');
    } catch {
      Alert.alert('Error', 'Failed to save progress settings.');
    }
  };

  const formatTime = (h: number, m: number) => {
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, '0');
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hh}:${mm} ${ampm}`;
  };

  return (
    <>
      {/* Preview */}
      <View style={styles.previewWrapper}>
        <CountdownPreview config={config} showProgress={progress.enabled} />
      </View>

      {/* Enable Toggle */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.sectionLabel}>PROGRESS MODE</Text>
            <Text style={styles.progressDesc}>Color dots by daily task completion</Text>
          </View>
          <Switch
            value={progress.enabled}
            onValueChange={handleProgressToggle}
            trackColor={{ false: AppTheme.colors.surfaceLighter, true: AppTheme.colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Today's Progress */}
      {progress.enabled && progress.tasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            TODAY — {todayDone}/{todayTotal} ({todayPercent}%)
          </Text>
          {progress.tasks.map((task) => {
            const isDone = todayLog.completed.includes(task);
            return (
              <TouchableOpacity
                key={task}
                style={[styles.taskCheckRow, isDone && styles.taskCheckRowDone]}
                onPress={() => handleToggle(task)}>
                <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                  {isDone && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={[styles.taskCheckText, isDone && styles.taskCheckTextDone]}>
                  {task}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Task Setup - Only show before saving */}
      {progress.enabled && showSetup && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DAILY TASKS</Text>
            <View style={styles.addTaskRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newTask}
                onChangeText={setNewTask}
                placeholder="Add a task..."
                placeholderTextColor={AppTheme.colors.textDim}
                maxLength={40}
                onSubmitEditing={handleAddTask}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {progress.tasks.map((task) => (
              <View key={task} style={styles.taskRow}>
                <Text style={styles.taskText}>{task}</Text>
                <TouchableOpacity onPress={() => handleRemoveTask(task)} hitSlop={8}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {progress.tasks.length === 0 && (
              <Text style={styles.emptyText}>No tasks yet. Add your daily goals above.</Text>
            )}
          </View>

          {/* Reminder Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DAILY REMINDER TIME</Text>
            <Text style={styles.progressDesc}>Get notified to update tasks. Resets at 00:00.</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
              <View style={styles.timeRow}>
                {HOUR_OPTIONS.map((h) => {
                  const isSelected = h === progress.reminderHour && progress.reminderMinute === 0;
                  return (
                    <TouchableOpacity
                      key={h}
                      style={[styles.timeChip, isSelected && styles.timeChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setReminderTime(h, 0);
                      }}>
                      <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                        {formatTime(h, 0)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </>
      )}

      {/* How it works */}
      {progress.enabled && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
          <Text style={styles.infoText}>
            Like a GitHub contribution graph — each day&apos;s dot color reflects your task completion
            ratio. Complete all tasks for a bright dot, skip everything for a dim one. Days with
            no data show the faintest shade.
          </Text>
        </View>
      )}

      {/* Save Button - Only show in setup mode */}
      {progress.enabled && showSetup && (
        <TouchableOpacity style={styles.saveProgressButton} onPress={handleSave} accessibilityRole="button">
          <Text style={styles.activateButtonText}>SAVE PROGRESS SETTINGS</Text>
        </TouchableOpacity>
      )}

      {/* Edit Button - Show when in active mode */}
      {progress.enabled && !showSetup && (
        <TouchableOpacity style={styles.saveProgressButton} onPress={() => setShowSetup(true)} accessibilityRole="button">
          <Text style={styles.activateButtonText}>EDIT TASKS & REMINDER</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

/* ─── Main Screen ────────────────────────────────────────────────── */

export default function SetupScreen() {
  const [activeTab, setActiveTab] = useState<'normal' | 'progress'>('normal');
  const insets = useSafeAreaInsets();

  const switchTab = (tab: 'normal' | 'progress') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LOCKIN</Text>
          <Text style={styles.headerSubtitle}>Countdown Wallpaper</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <Pressable
            style={({ pressed }) => [
              styles.tabButton,
              activeTab === 'normal' && styles.tabButtonActive,
              pressed && styles.tabButtonPressed,
            ]}
            onPress={() => switchTab('normal')}>
            <Text style={[styles.tabButtonText, activeTab === 'normal' && styles.tabButtonTextActive]}>
              NORMAL
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.tabButton,
              activeTab === 'progress' && styles.tabButtonActive,
              pressed && styles.tabButtonPressed,
            ]}
            onPress={() => switchTab('progress')}>
            <Text style={[styles.tabButtonText, activeTab === 'progress' && styles.tabButtonTextActive]}>
              PROGRESS MODE
            </Text>
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'normal' ? <NormalTab /> : <ProgressModeTab />}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: AppTheme.spacing.lg,
    paddingTop: AppTheme.spacing.xl + AppTheme.spacing.md,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: AppTheme.spacing.xl,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#F5F5F5',
    letterSpacing: 7,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppTheme.colors.textSecondary,
    letterSpacing: 2.6,
    marginTop: AppTheme.spacing.xs,
  },

  /* ── Tab Switcher ── */
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.md,
    padding: AppTheme.spacing.xs,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    marginBottom: AppTheme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: AppTheme.borderRadius.sm + 2,
  },
  tabButtonActive: {
    backgroundColor: AppTheme.colors.surfaceLighter,
  },
  tabButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: AppTheme.colors.surfaceLight,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppTheme.colors.textMuted,
    letterSpacing: 1.5,
  },
  tabButtonTextActive: {
    color: AppTheme.colors.accent,
  },

  /* ── Shared ── */
  previewWrapper: {
    alignItems: 'center',
    marginBottom: AppTheme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AppTheme.spacing.xl,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 13,
    color: AppTheme.colors.textSecondary,
    letterSpacing: 1,
  },
  section: {
    marginBottom: AppTheme.spacing.lg,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppTheme.colors.textSecondary,
    letterSpacing: 2,
    marginBottom: AppTheme.spacing.sm,
  },
  input: {
    backgroundColor: AppTheme.colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.borderRadius.md,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 12,
    color: AppTheme.colors.text,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: AppTheme.colors.textDim,
    marginTop: 6,
    lineHeight: 17,
  },
  modeRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: AppTheme.borderRadius.md,
    backgroundColor: AppTheme.colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: AppTheme.colors.accent,
    backgroundColor: AppTheme.colors.surfaceLight,
  },
  modeButtonPressed: {
    transform: [{ scale: 0.985 }],
    borderColor: AppTheme.colors.borderLight,
    backgroundColor: '#222222',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppTheme.colors.textMuted,
    letterSpacing: 1.5,
  },
  modeButtonTextActive: {
    color: AppTheme.colors.accent,
  },
  activateButton: {
    backgroundColor: AppTheme.colors.accent,
    borderRadius: AppTheme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: AppTheme.spacing.lg,
  },
  activateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 2,
  },
  widgetSection: {
    marginTop: AppTheme.spacing.xl,
    paddingTop: AppTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: AppTheme.colors.border,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: AppTheme.spacing.sm,
  },
  widgetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  widgetStatusText: {
    fontSize: 11,
    color: AppTheme.colors.textSecondary,
    letterSpacing: 1,
  },
  widgetButton: {
    borderRadius: AppTheme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppTheme.colors.accent,
    backgroundColor: 'transparent',
  },
  widgetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppTheme.colors.accent,
    letterSpacing: 2,
  },

  /* ── Progress Mode ── */
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressDesc: {
    fontSize: 11,
    color: AppTheme.colors.textDim,
    marginTop: 2,
  },
  addTaskRow: {
    flexDirection: 'row',
    gap: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.md,
  },
  addButton: {
    backgroundColor: AppTheme.colors.accent,
    width: 48,
    borderRadius: AppTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.md,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 12,
    marginBottom: 6,
  },
  taskText: {
    color: AppTheme.colors.text,
    fontSize: 14,
    flex: 1,
  },
  removeText: {
    color: AppTheme.colors.error,
    fontSize: 16,
    fontWeight: '700',
    paddingLeft: 12,
  },
  emptyText: {
    color: AppTheme.colors.textDim,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  taskCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.md,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  taskCheckRowDone: {
    borderColor: AppTheme.colors.accent,
    backgroundColor: AppTheme.colors.surfaceLight,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: AppTheme.colors.textMuted,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: AppTheme.colors.accent,
    borderColor: AppTheme.colors.accent,
  },
  checkMark: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  taskCheckText: {
    color: AppTheme.colors.text,
    fontSize: 15,
  },
  taskCheckTextDone: {
    color: AppTheme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  timeScroll: {
    marginTop: AppTheme.spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: AppTheme.borderRadius.md,
    backgroundColor: AppTheme.colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  timeChipActive: {
    borderColor: AppTheme.colors.accent,
    backgroundColor: AppTheme.colors.surfaceLight,
  },
  timeChipText: {
    fontSize: 12,
    color: AppTheme.colors.textMuted,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: AppTheme.colors.accent,
  },
  infoText: {
    fontSize: 12,
    color: AppTheme.colors.textDim,
    lineHeight: 18,
  },
  saveProgressButton: {
    backgroundColor: AppTheme.colors.accent,
    borderRadius: AppTheme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: AppTheme.spacing.lg,
  },
  bottomSpacer: {
    height: 40,
  },
});
