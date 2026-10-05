import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import HomeScreen from "../screens/home/HomeScreen";
import AdminDashboardScreen from "../screens/home/AdminDashboardScreen";
import PunchScreen from "../screens/attendance/PunchScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import NotificationSettingsScreen from "../screens/profile/NotificationSettingsScreen";
import GymProfileScreen from "../screens/profile/GymProfileScreen";
import MemberManagementScreen from "../screens/members/MemberManagementScreen";
import PlanManagementScreen from "../screens/plans/PlanManagementScreen";
import PlatformAdminScreen from "../screens/admin/PlatformAdminScreen";
import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/tokens";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function ProfileStackNavigator() {
  const role = useAuthStore((state) => state.user?.role);
  const isGymAdmin = role === "GYM_OWNER" || role === "GYM_STAFF";

  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      {isGymAdmin && (
        <ProfileStack.Screen
          name="GymProfile"
          component={GymProfileScreen}
          options={{ title: "Gym Profile" }}
        />
      )}
      <ProfileStack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: "Notification Settings" }}
      />
    </ProfileStack.Navigator>
  );
}

// Icon mappings per Section 5 of Gym App Design Guide
// Outlined when inactive, filled when active. Size 24.
const TAB_ICONS: Record<
  string,
  { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }
> = {
  Home: { focused: "home", outline: "home-outline" },
  Dashboard: { focused: "stats-chart", outline: "stats-chart-outline" },
  "Check In": { focused: "qr-code", outline: "qr-code-outline" },
  Members: { focused: "people", outline: "people-outline" },
  Plans: { focused: "card", outline: "card-outline" },
  Admin: { focused: "shield-checkmark", outline: "shield-checkmark-outline" },
  Profile: { focused: "person", outline: "person-outline" },
};

export function MainTabs() {
  const role = useAuthStore((s) => s.user?.role);
  const isGymAdmin = role === "GYM_OWNER" || role === "GYM_STAFF";
  const isPlatformAdmin = role === "PLATFORM_ADMIN";

  const renderTabBarIcon = (routeName: string, focused: boolean, color: string) => {
    const iconConfig = TAB_ICONS[routeName] ?? {
      focused: "ellipse",
      outline: "ellipse-outline",
    };
    const iconName = focused ? iconConfig.focused : iconConfig.outline;
    return <Ionicons name={iconName} size={24} color={color} />;
  };

  const commonScreenOptions = ({ route }: { route: { name: string } }) => ({
    headerShown: false,
    tabBarActiveTintColor: colors.primary, // Volt Violet (#7C5CFF)
    tabBarInactiveTintColor: colors.textDim, // Dust (#A0A6BA)
    tabBarStyle: {
      backgroundColor: colors.card, // Slate (#1E2230)
      borderTopColor: colors.border, // Steel (#2C3145)
      borderTopWidth: 1,
      height: Platform.OS === "ios" ? 84 : 68,
      paddingBottom: Platform.OS === "ios" ? 24 : 10,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: "600" as const,
    },
    tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) =>
      renderTabBarIcon(route.name, focused, color),
  });

  // Super admin sees Platform Admin + Profile tabs
  if (isPlatformAdmin) {
    return (
      <Tab.Navigator screenOptions={commonScreenOptions}>
        <Tab.Screen name="Admin" component={PlatformAdminScreen} />
        <Tab.Screen name="Profile" component={ProfileStackNavigator} />
      </Tab.Navigator>
    );
  }

  // Gym Owner / Staff sees Dashboard, Members, Plans, Profile
  // Member sees Home, Check In, Plans, Profile
  return (
    <Tab.Navigator screenOptions={commonScreenOptions}>
      <Tab.Screen
        name={isGymAdmin ? "Dashboard" : "Home"}
        component={isGymAdmin ? AdminDashboardScreen : HomeStackNavigator}
      />
      {!isGymAdmin && <Tab.Screen name="Check In" component={PunchScreen} />}
      {isGymAdmin && (
        <Tab.Screen name="Members" component={MemberManagementScreen} />
      )}
      <Tab.Screen name="Plans" component={PlanManagementScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
