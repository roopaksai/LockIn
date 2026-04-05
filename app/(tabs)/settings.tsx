import { AppTheme } from '@/constants/theme';
import { useProgress } from '@/contexts/progress-context';
import { useWallpaper } from '@/contexts/wallpaper-context';
import { isFeedbackConfigured, submitFeedback } from '@/services/feedback-service';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
  const { progress } = useProgress();
  const insets = useSafeAreaInsets();
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const feedbackConfigured = isFeedbackConfigured();

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

  const closeFeedbackModal = () => {
    if (submittingFeedback) return;
    setFeedbackVisible(false);
  };

  const openFeedbackModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedbackVisible(true);
  };

  const handleFeedbackSubmit = async () => {
    const message = feedbackMessage.trim();

    if (!message) {
      Alert.alert('Feedback required', 'Please enter your feedback before submitting.');
      return;
    }

    if (!feedbackConfigured) {
      Alert.alert(
        'Feedback unavailable',
        'Feedback channel is not configured yet. Please set EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL.',
      );
      return;
    }

    try {
      setSubmittingFeedback(true);

      await submitFeedback({
        message,
        contact: feedbackContact,
        context: {
          mode: config.mode,
          targetDays: config.targetDays,
          progressEnabled: progress.enabled,
          taskCount: progress.tasks.length,
          appVersion: Constants.expoConfig?.version ?? 'unknown',
          platform: Platform.OS,
        },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedbackMessage('');
      setFeedbackContact('');
      setFeedbackVisible(false);
      Alert.alert('Thank you', 'Your feedback has been submitted.');
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const details = error instanceof Error ? error.message : 'Please try again in a moment.';
      Alert.alert('Could not send feedback', details);
    } finally {
      setSubmittingFeedback(false);
    }
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

        <View style={styles.supportDivider} />

        {/* Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>
          <Text style={styles.feedbackTitle}>Help us improve LockIn</Text>
          <Text style={styles.feedbackHint}>
            Share issues, ideas, or feature requests. We read every submission.
          </Text>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={openFeedbackModal}
            accessibilityLabel="Send feedback"
            accessibilityRole="button">
            <Text style={styles.feedbackButtonText}>SEND FEEDBACK</Text>
          </TouchableOpacity>
          {!feedbackConfigured && (
            <Text style={styles.feedbackWarning}>
              Developer note: set EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL to enable submissions.
            </Text>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal
        visible={feedbackVisible}
        transparent
        animationType="fade"
        onRequestClose={closeFeedbackModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SEND FEEDBACK</Text>
            <Text style={styles.modalSubtitle}>What can we improve?</Text>

            <TextInput
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              placeholder="Tell us your feedback"
              placeholderTextColor={AppTheme.colors.textDim}
              multiline
              textAlignVertical="top"
              style={[styles.inputBase, styles.messageInput]}
              editable={!submittingFeedback}
            />

            <TextInput
              value={feedbackContact}
              onChangeText={setFeedbackContact}
              placeholder="Contact (optional email/telegram)"
              placeholderTextColor={AppTheme.colors.textDim}
              style={styles.inputBase}
              editable={!submittingFeedback}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.metaText}>
              Anonymous app context is included (mode, task count, app version, platform).
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeFeedbackModal}
                disabled={submittingFeedback}
                accessibilityRole="button"
                accessibilityLabel="Cancel feedback">
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton, submittingFeedback && styles.modalButtonDisabled]}
                onPress={handleFeedbackSubmit}
                disabled={submittingFeedback}
                accessibilityRole="button"
                accessibilityLabel="Submit feedback">
                {submittingFeedback ? (
                  <ActivityIndicator size="small" color={AppTheme.colors.background} />
                ) : (
                  <Text style={styles.modalSubmitText}>SUBMIT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  feedbackHint: {
    fontSize: 12,
    color: AppTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: AppTheme.spacing.md,
  },
  supportDivider: {
    height: 1,
    backgroundColor: AppTheme.colors.border,
    marginTop: AppTheme.spacing.lg,
    marginBottom: AppTheme.spacing.lg,
    opacity: 0.7,
  },
  feedbackSection: {
    marginTop: AppTheme.spacing.sm,
    marginBottom: AppTheme.spacing.lg,
    padding: AppTheme.spacing.md + 2,
    borderRadius: AppTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: AppTheme.colors.borderLight,
    backgroundColor: AppTheme.colors.surface,
  },
  feedbackTitle: {
    fontSize: 14,
    color: AppTheme.colors.text,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: AppTheme.spacing.xs,
  },
  feedbackButton: {
    backgroundColor: AppTheme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: AppTheme.colors.borderLight,
    borderRadius: AppTheme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  feedbackButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppTheme.colors.text,
    letterSpacing: 1.8,
  },
  feedbackWarning: {
    marginTop: AppTheme.spacing.sm,
    fontSize: 11,
    color: AppTheme.colors.warning,
    lineHeight: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    padding: AppTheme.spacing.lg,
  },
  modalCard: {
    backgroundColor: AppTheme.colors.surface,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.borderRadius.lg,
    padding: AppTheme.spacing.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppTheme.colors.text,
    letterSpacing: 1.8,
  },
  modalSubtitle: {
    marginTop: 6,
    marginBottom: AppTheme.spacing.md,
    fontSize: 12,
    color: AppTheme.colors.textSecondary,
    letterSpacing: 0.3,
  },
  inputBase: {
    backgroundColor: AppTheme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.borderRadius.md,
    color: AppTheme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginTop: AppTheme.spacing.sm,
  },
  messageInput: {
    minHeight: 120,
    maxHeight: 160,
  },
  metaText: {
    marginTop: AppTheme.spacing.md,
    fontSize: 11,
    color: AppTheme.colors.textDim,
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: AppTheme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    borderRadius: AppTheme.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: AppTheme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
  },
  modalSubmitButton: {
    backgroundColor: AppTheme.colors.accent,
  },
  modalButtonDisabled: {
    opacity: 0.65,
  },
  modalCancelText: {
    color: AppTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  modalSubmitText: {
    color: AppTheme.colors.background,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
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
