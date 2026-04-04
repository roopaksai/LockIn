import { AppTheme } from '@/constants/theme';
import { useWallpaper } from '@/contexts/wallpaper-context';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG_PRESETS = AppTheme.backgroundPresets;

const COLOR_PRESETS = [
  { label: 'Orange', value: '#FF8C00' },
  { label: 'Cyan', value: '#00BCD4' },
  { label: 'Lime', value: '#CDDC39' },
  { label: 'Pink', value: '#E91E63' },
  { label: 'Purple', value: '#9C27B0' },
  { label: 'White', value: '#FFFFFF' },
];

const COMPLETED_PRESETS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Light Grey', value: '#CCCCCC' },
  { label: 'Soft White', value: '#E8E8E8' },
  { label: 'Ice Blue', value: '#D0E8F0' },
];

const REMAINING_PRESETS = [
  { label: 'Grey', value: '#4A4A4A' },
  { label: 'Charcoal', value: '#333333' },
  { label: 'Muted Blue', value: '#1A2A3A' },
  { label: 'Deep Green', value: '#1A3A2A' },
  { label: 'Dim', value: '#222222' },
];

export default function SettingsScreen() {
  const { config, updateConfig, saveConfig } = useWallpaper();
  const insets = useSafeAreaInsets();

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await saveConfig();
      Alert.alert('Saved', 'Settings saved. Changes will appear on your wallpaper.');
    } catch {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const handleColorSelect = (key: string, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateConfig({ [key]: value });
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <Text style={styles.headerSubtitle}>Customize Appearance</Text>
        </View>

        {/* Background Color */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BACKGROUND</Text>
          <View style={styles.colorRow}>
            {BG_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: preset.value },
                  config.backgroundColor === preset.value && styles.colorSwatchActive,
                ]}
                onPress={() => handleColorSelect('backgroundColor', preset.value)}
                accessibilityLabel={`Background color: ${preset.label}`}
                accessibilityState={{ selected: config.backgroundColor === preset.value }}
                accessibilityRole="button">
                {config.backgroundColor === preset.value && (
                  <View style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.colorLabel}>
            {BG_PRESETS.find((p) => p.value === config.backgroundColor)?.label ?? 'Custom'}
          </Text>
        </View>

        {/* Current Day Color */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CURRENT DAY</Text>
          <View style={styles.colorRow}>
            {COLOR_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: preset.value },
                  config.currentColor === preset.value && styles.colorSwatchActive,
                ]}
                onPress={() => handleColorSelect('currentColor', preset.value)}
                accessibilityLabel={`Current day color: ${preset.label}`}
                accessibilityState={{ selected: config.currentColor === preset.value }}
                accessibilityRole="button">
                {config.currentColor === preset.value && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: preset.value === '#FFFFFF' ? '#000' : '#FFF' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.colorLabel}>
            {COLOR_PRESETS.find((p) => p.value === config.currentColor)?.label ?? 'Custom'}
          </Text>
        </View>

        {/* Completed Days Color */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMPLETED DAYS</Text>
          <View style={styles.colorRow}>
            {COMPLETED_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: preset.value },
                  config.completedColor === preset.value && styles.colorSwatchActive,
                ]}
                onPress={() => handleColorSelect('completedColor', preset.value)}
                accessibilityLabel={`Completed days color: ${preset.label}`}
                accessibilityState={{ selected: config.completedColor === preset.value }}
                accessibilityRole="button">
                {config.completedColor === preset.value && (
                  <View style={styles.checkmark} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.colorLabel}>
            {COMPLETED_PRESETS.find((p) => p.value === config.completedColor)?.label ?? 'Custom'}
          </Text>
        </View>

        {/* Remaining Days Color */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REMAINING DAYS</Text>
          <View style={styles.colorRow}>
            {REMAINING_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.value}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: preset.value },
                  config.remainingColor === preset.value && styles.colorSwatchActive,
                ]}
                onPress={() => handleColorSelect('remainingColor', preset.value)}
                accessibilityLabel={`Remaining days color: ${preset.label}`}
                accessibilityState={{ selected: config.remainingColor === preset.value }}
                accessibilityRole="button">
                {config.remainingColor === preset.value && (
                  <View
                    style={[
                      styles.checkmark,
                      { backgroundColor: '#000' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.colorLabel}>
            {REMAINING_PRESETS.find((p) => p.value === config.remainingColor)?.label ?? 'Custom'}
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityLabel="Save settings"
          accessibilityRole="button">
          <Text style={styles.saveButtonText}>SAVE SETTINGS</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            Changes are applied to the live wallpaper after saving.
            The wallpaper refreshes daily at midnight.
          </Text>
        </View>

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
    paddingTop: 56,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: AppTheme.spacing.xl + 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppTheme.colors.text,
    letterSpacing: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    color: AppTheme.colors.textMuted,
    letterSpacing: 3,
    marginTop: 4,
  },
  section: {
    marginBottom: AppTheme.spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppTheme.colors.textMuted,
    letterSpacing: 2,
    marginBottom: AppTheme.spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: AppTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderColor: AppTheme.colors.accent,
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  colorLabel: {
    fontSize: 11,
    color: AppTheme.colors.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  saveButton: {
    backgroundColor: AppTheme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: AppTheme.colors.accent,
    borderRadius: AppTheme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: AppTheme.spacing.sm,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppTheme.colors.accent,
    letterSpacing: 2,
  },
  infoSection: {
    marginTop: AppTheme.spacing.xl,
    paddingHorizontal: AppTheme.spacing.sm,
  },
  infoText: {
    fontSize: 11,
    color: AppTheme.colors.textDim,
    lineHeight: 18,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 40,
  },
});
