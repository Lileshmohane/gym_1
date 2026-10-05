import React, { useCallback, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import SplashScreen from "../screens/auth/SplashScreen";
import { Toast } from "../components/Toast";
import { useAuthStore } from "../store/authStore";
import { useForegroundNotificationListener } from "../notifications/pushNotifications";
import { colors } from "../theme/tokens";

const navTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

export function RootNavigator() {
  const { user, isHydrated, hydrate } = useAuthStore();
  const [toast, setToast] = useState<{
    title: string;
    body: string;
    visible: boolean;
    variant?: "success" | "error" | "info";
  }>({
    title: "",
    body: "",
    visible: false,
    variant: "success",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Surfaces a reminder as an in-app toast if it arrives while the app is open
  const handleForegroundNotification = useCallback((title: string, body: string) => {
    setToast({ title, body, visible: true, variant: "info" });
  }, []);
  useForegroundNotificationListener(handleForegroundNotification);

  if (!isHydrated) return <SplashScreen />;

  return (
    <>
      <NavigationContainer theme={navTheme}>
        {user ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
      <Toast
        title={toast.title}
        body={toast.body}
        variant={toast.variant}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </>
  );
}
