import { useEffect } from "react";
import { Platform } from "react-native";
import { isRunningInExpoGo } from "expo";

// Foreground behavior: show a banner + play sound even while the app is open
if (!isRunningInExpoGo()) {
  void import("expo-notifications").then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  });
}

// Foreground listener — surfaces a reminder as an in-app toast (see Toast.tsx)
export function useForegroundNotificationListener(
  onReceive: (title: string, body: string) => void
) {
  useEffect(() => {
    if (isRunningInExpoGo()) return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    void import("expo-notifications").then((Notifications) => {
      if (cancelled) return;
      subscription = Notifications.addNotificationReceivedListener((notification) => {
        const { title, body } = notification.request.content;
        onReceive(title ?? "FitTrack Pro", body ?? "");
      });
    });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [onReceive]);
}

// Setup and schedule notifications per Section 8 of Gym App Design Guide
export async function setupNotifications(): Promise<boolean> {
  if (isRunningInExpoGo()) return false;
  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return false;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("workout", {
        name: "Workout reminders",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#7C5CFF",
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Membership reminders",
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: "#7C5CFF",
      });
    }
    return true;
  } catch {
    return false;
  }
}

// Daily reminder (Section 8: e.g. at 6 PM)
export async function scheduleDailyWorkout() {
  if (isRunningInExpoGo()) return;
  const Notifications = await import("expo-notifications");
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Leg Day Reminder",
      body: "Your workout plan is ready. Time to hit the gym!",
      data: { screen: "Workouts" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 18,
      minute: 0,
      channelId: "workout",
    },
  });
}

// Rest timer alert (Section 8: when rest period ends)
export async function scheduleRestAlert(seconds: number) {
  if (isRunningInExpoGo()) return;
  const Notifications = await import("expo-notifications");
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Rest Over",
      body: "Start your next set. Stay focused!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}

// Fires a real local OS notification immediately for verification
export async function sendLocalTestNotification(): Promise<"sent" | "denied" | "unavailable"> {
  if (isRunningInExpoGo()) return "unavailable";

  const Notifications = await import("expo-notifications");
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return "denied";

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("workout", {
      name: "Workout reminders",
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: "#7C5CFF",
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "FitTrack Pro Alert",
      body: "Your gym membership renewal is in 3 days. Keep your streak alive!",
    },
    trigger: null,
  });
  return "sent";
}
