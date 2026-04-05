import { DEFAULT_PROGRESS, DayLog, ProgressConfig } from '@/constants/theme';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { configStorage } from './config-storage';

type ProgressContextType = {
  progress: ProgressConfig;
  addTask: (title: string) => void;
  removeTask: (title: string) => void;
  toggleTaskDone: (taskTitle: string) => void;
  setReminderTime: (hour: number, minute: number) => void;
  setEnabled: (enabled: boolean) => void;
  getTodayLog: () => DayLog;
  save: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextType>({
  progress: DEFAULT_PROGRESS,
  addTask: () => {},
  removeTask: () => {},
  toggleTaskDone: () => {},
  setReminderTime: () => {},
  setEnabled: () => {},
  getTodayLog: () => ({ completed: [], total: 0 }),
  save: async () => {},
});

export const useProgress = () => useContext(ProgressContext);

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function scheduleReminder(hour: number, minute: number) {
  if (Platform.OS !== 'android') return;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Task Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'LockIn',
        body: 'Time to update your daily tasks!',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'daily-reminder',
      },
    });
  } catch (e) {
    console.warn('Failed to schedule notification:', e);
  }
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<ProgressConfig>(DEFAULT_PROGRESS);
  const [lastViewed, setLastViewed] = useState(todayKey());
  const hasLoadedRef = useRef(false);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const json = await configStorage.load('progressData');
        if (json) {
          const parsed = JSON.parse(json);
          setProgress({
            enabled: parsed.enabled ?? false,
            tasks: parsed.tasks ?? [],
            dailyLog: parsed.dailyLog ?? {},
            reminderHour: parsed.reminderHour ?? 21,
            reminderMinute: parsed.reminderMinute ?? 0,
          });
        }
      } catch (e) {
        console.warn('Failed to load progress data:', e);
        // Use defaults
      } finally {
        hasLoadedRef.current = true;
      }
    })();
  }, []);

  // Persist progress data automatically so wallpaper/widget stays in sync.
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(async () => {
      try {
        await configStorage.save('progressData', JSON.stringify(progress));
      } catch (e) {
        console.warn('Failed to auto-save progress data:', e);
      }
    }, 250);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
    };
  }, [progress]);

  // Keep reminder notification configuration in sync without touching it on every task toggle.
  useEffect(() => {
    if (!hasLoadedRef.current) return;

    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = setTimeout(async () => {
      try {
        if (progress.enabled && progress.tasks.length > 0) {
          await scheduleReminder(progress.reminderHour, progress.reminderMinute);
        } else {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
      } catch (e) {
        console.warn('Failed to auto-sync reminder:', e);
      }
    }, 300);

    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [progress.enabled, progress.tasks, progress.reminderHour, progress.reminderMinute]);

  useEffect(() => {
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Reset completed tasks when day changes
  useEffect(() => {
    const checkAndResetDay = () => {
      const currentDay = todayKey();
      if (currentDay !== lastViewed) {
        setLastViewed(currentDay);
        // Reset completed tasks for the new day
        setProgress((prev) => ({
          ...prev,
          dailyLog: {
            ...prev.dailyLog,
            [currentDay]: { completed: [], total: prev.tasks.length },
          },
        }));
      }
    };

    // Check immediately on mount/update
    checkAndResetDay();

    // Check every minute for day change (fallback)
    const interval = setInterval(checkAndResetDay, 60000);

    // Also check when app comes into focus (catches day changes even if app was closed)
    const subscription = AppState.addEventListener('focus', checkAndResetDay);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [lastViewed]);

  const addTask = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setProgress((prev) => {
      if (prev.tasks.includes(trimmed)) return prev;
      return { ...prev, tasks: [...prev.tasks, trimmed] };
    });
  }, []);

  const removeTask = useCallback((title: string) => {
    setProgress((prev) => {
      const tasks = prev.tasks.filter((t) => t !== title);
      // Also remove from today's completed list
      const key = todayKey();
      const dayLog = prev.dailyLog[key];
      if (dayLog) {
        const completed = dayLog.completed.filter((t) => t !== title);
        return {
          ...prev,
          tasks,
          dailyLog: {
            ...prev.dailyLog,
            [key]: { completed, total: tasks.length },
          },
        };
      }
      return { ...prev, tasks };
    });
  }, []);

  const toggleTaskDone = useCallback((taskTitle: string) => {
    setProgress((prev) => {
      const key = todayKey();
      const existing = prev.dailyLog[key] || { completed: [], total: prev.tasks.length };
      const isCompleted = existing.completed.includes(taskTitle);
      const completed = isCompleted
        ? existing.completed.filter((t) => t !== taskTitle)
        : [...existing.completed, taskTitle];

      return {
        ...prev,
        dailyLog: {
          ...prev.dailyLog,
          [key]: { completed, total: prev.tasks.length },
        },
      };
    });
  }, []);

  const setReminderTime = useCallback((hour: number, minute: number) => {
    setProgress((prev) => ({ ...prev, reminderHour: hour, reminderMinute: minute }));
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    setProgress((prev) => ({ ...prev, enabled }));
  }, []);

  const getTodayLog = useCallback((): DayLog => {
    const key = todayKey();
    return progress.dailyLog[key] || { completed: [], total: progress.tasks.length };
  }, [progress.dailyLog, progress.tasks.length]);

  const save = useCallback(async () => {
    try {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }

      const json = JSON.stringify(progress);
      await configStorage.save('progressData', json);

      // Schedule/update notification if enabled
      if (progress.enabled && progress.tasks.length > 0) {
        await scheduleReminder(progress.reminderHour, progress.reminderMinute);
      } else {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (e) {
      console.warn('Failed to save progress:', e);
      throw e;
    }
  }, [progress]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        addTask,
        removeTask,
        toggleTaskDone,
        setReminderTime,
        setEnabled,
        getTodayLog,
        save,
      }}>
      {children}
    </ProgressContext.Provider>
  );
}
