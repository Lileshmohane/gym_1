import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../theme/tokens";

export type NotificationType = "workout" | "streak" | "achievement" | "membership";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

const TYPE_CONFIG: Record<
  NotificationType,
  { color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  workout: { color: colors.primary, icon: "fitness" }, // Violet (#7C5CFF)
  streak: { color: colors.accent, icon: "flame" }, // Coral (#FF6B4A)
  achievement: { color: colors.success, icon: "trophy" }, // Mint (#2EE6A6)
  membership: { color: colors.warning, icon: "card" }, // Amber (#FFC53D)
};

export function NotificationBell({
  unreadCount = 2,
  onPress,
}: {
  unreadCount?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      style={styles.bellButton}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {unreadCount > 0 && (
        <View style={styles.unreadDot}>
          {unreadCount > 1 && (
            <Text style={styles.unreadText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

export function NotificationModal({
  visible,
  onClose,
  notifications = DEFAULT_NOTIFICATIONS,
}: {
  visible: boolean;
  onClose: () => void;
  notifications?: AppNotification[];
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissOverlay} onPress={onClose} />
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{notifications.length}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textDim} />
            </Pressable>
          </View>

          {/* Notification List */}
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((item) => {
              const cfg = TYPE_CONFIG[item.type];
              return (
                <View
                  key={item.id}
                  style={[
                    styles.notifRow,
                    item.unread && styles.unreadRow,
                  ]}
                >
                  {/* Colored Icon Circle per Section 8 */}
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${cfg.color}25` },
                    ]}
                  >
                    <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                  </View>
                  <View style={styles.notifTextWrap}>
                    <View style={styles.notifTop}>
                      <Text style={styles.notifTitle}>{item.title}</Text>
                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.notifBody}>{item.body}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    type: "workout",
    title: "Leg day reminder",
    body: "Leg day scheduled for 6:00 PM. Your plan is ready.",
    time: "10m ago",
    unread: true,
  },
  {
    id: "2",
    type: "streak",
    title: "7-Day streak alert",
    body: "7 days in a row! Train today to keep the momentum going.",
    time: "2h ago",
    unread: true,
  },
  {
    id: "3",
    type: "membership",
    title: "Plan renewal",
    body: "Standard Gym Pass renews in 3 days. Check billing details.",
    time: "1d ago",
  },
  {
    id: "4",
    type: "achievement",
    title: "New personal record",
    body: "Bench press 80 kg recorded! Great progress this month.",
    time: "2d ago",
  },
];

const styles = StyleSheet.create({
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent, // Flame Coral (#FF6B4A) per Section 8
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  unreadText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  dismissOverlay: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.card, // Slate (#1E2230)
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: "80%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    ...typography.display,
    fontSize: 22,
    color: colors.text,
  },
  badgeCount: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  unreadRow: {
    backgroundColor: "rgba(124, 92, 255, 0.05)",
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  notifTextWrap: {
    flex: 1,
  },
  notifTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notifTitle: {
    ...typography.h2,
    fontSize: 15,
    color: colors.text,
  },
  notifTime: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textDim,
  },
  notifBody: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 18,
  },
});
