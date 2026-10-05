import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/Button";
import { NotificationBell, NotificationModal } from "../../components/NotificationModal";
import { useAuthStore } from "../../store/authStore";
import { useGymDashboard, GymDashboard } from "../../api/hooks";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { gymImages } from "../../theme/images";

export default function AdminDashboardScreen({ navigation }: any) {
  const name = useAuthStore((state) => state.user?.name);
  const { data, isLoading, isError, refetch } = useGymDashboard();
  const [notifVisible, setNotifVisible] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gym Background Hero Header with Dark Gradient Overlay */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: gymImages.adminBg }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[
              "rgba(18, 20, 28, 0.4)",
              "rgba(18, 20, 28, 0.85)",
              colors.bg,
            ]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Bar with Gym Admin Info and Notification Bell */}
          <View style={styles.topBar}>
            <View>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                <Text style={styles.roleText}>GYM OVERVIEW</Text>
              </View>
              <Text style={styles.title}>Hi, {name?.split(" ")[0] ?? "Admin"}</Text>
            </View>
            <NotificationBell
              unreadCount={2}
              onPress={() => setNotifVisible(true)}
            />
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {isLoading && (
            <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
          )}

          {isError && (
            <Card style={styles.errorCard}>
              <EmptyState
                icon="alert-circle-outline"
                iconColor={colors.warning}
                message="Couldn't load the gym dashboard."
              />
              <Button label="Tap to retry" variant="ghost" onPress={() => refetch()} style={{ marginTop: spacing.sm }} />
            </Card>
          )}

          {data && (
            <>
              {/* High-impact Metrics 2x2 Grid */}
              <View style={styles.grid}>
                <Metric
                  label="Active members"
                  value={data.activeMembers}
                  icon="people"
                  color={colors.primary}
                />
                <Metric
                  label="Active plans"
                  value={data.activeSubscriptions}
                  icon="card"
                  color={colors.success}
                />
                <Metric
                  label="Expiring soon"
                  value={data.expiringWithin7Days}
                  icon="time"
                  color={colors.warning}
                />
                <Metric
                  label="Check-ins today"
                  value={data.checkInsToday}
                  icon="flame"
                  color={colors.accent}
                />
              </View>

              {/* Monthly Revenue Card */}
              <Card style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                  <View>
                    <Text style={styles.revenueLabel}>Revenue this month</Text>
                    <Text style={styles.revenueValue}>
                      ₹{data.revenueThisMonth.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View style={styles.revenueIconWrap}>
                    <Ionicons name="trending-up" size={28} color={colors.success} />
                  </View>
                </View>
                <View style={styles.revenueFooter}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.textDim} />
                  <Text style={styles.revenueFootText}>
                    {data.expired} expired memberships this month
                  </Text>
                </View>
              </Card>

              {/* Quick Actions Bar */}
              <View style={styles.quickActions}>
                <Button
                  label="Manage members"
                  icon="people-outline"
                  variant="ghost"
                  onPress={() => navigation?.navigate?.("Members")}
                  style={styles.actionBtn}
                />
                <Button
                  label="View plans"
                  icon="card-outline"
                  variant="ghost"
                  onPress={() => navigation?.navigate?.("Plans")}
                  style={styles.actionBtn}
                />
              </View>

              {/* Membership Breakdown Groups */}
              <MembershipGroup
                title="Active Memberships"
                badgeColor={colors.success}
                members={data.activeMemberList}
              />
              <MembershipGroup
                title="Expiring Within 3 Days"
                badgeColor={colors.warning}
                members={data.expiringMembers}
              />
              <MembershipGroup
                title="Expired Memberships"
                badgeColor={colors.error}
                members={data.expiredMembers}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* In-app Notification Center Modal */}
      <NotificationModal
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
      />
    </View>
  );
}

function MembershipGroup({
  title,
  badgeColor,
  members,
}: {
  title: string;
  badgeColor: string;
  members: GymDashboard["activeMemberList"];
}) {
  return (
    <Card style={styles.groupCard}>
      <View style={styles.groupHeading}>
        <View style={styles.groupTitleWrap}>
          <View style={[styles.groupDot, { backgroundColor: badgeColor }]} />
          <Text style={styles.groupTitle}>{title}</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: `${badgeColor}20` }]}>
          <Text style={[styles.countBadgeText, { color: badgeColor }]}>
            {members.length}
          </Text>
        </View>
      </View>

      {members.length === 0 ? (
        <Text style={styles.emptyText}>No members in this category.</Text>
      ) : (
        members.slice(0, 5).map((member) => (
          <View key={member.memberId} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarInitials}>
                {member.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberMeta}>
                {member.planName}
                {member.phone ? ` · ${member.phone}` : ""}
              </Text>
            </View>
            <View style={styles.endDateWrap}>
              <Text style={styles.endDateLabel}>Ends</Text>
              <Text style={styles.endDateValue}>{member.endDate}</Text>
            </View>
          </View>
        ))
      )}
    </Card>
  );
}

function Metric({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <Card style={styles.metricCard}>
      <View style={styles.metricTop}>
        <View style={[styles.metricIconBox, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  heroContainer: {
    height: 190,
    position: "relative",
    paddingTop: 54,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 92, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  roleText: {
    ...typography.label,
    fontSize: 11,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    ...typography.display,
    fontSize: 30,
    color: colors.text,
  },
  body: {
    paddingHorizontal: spacing.lg,
    marginTop: -10,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  errorCard: {
    alignItems: "center",
    padding: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  metricCard: {
    width: "48%",
    minHeight: 104,
    padding: spacing.md,
    marginBottom: 0,
    justifyContent: "space-between",
  },
  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    ...typography.stats,
    fontSize: 32,
    fontWeight: "700",
  },
  metricLabel: {
    ...typography.caption,
    fontSize: 13,
    color: colors.textDim,
    marginTop: 8,
  },
  revenueCard: {
    marginTop: 14,
    padding: spacing.lg,
    borderColor: "rgba(46, 230, 166, 0.3)",
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    ...typography.caption,
    color: colors.textDim,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  revenueValue: {
    ...typography.stats,
    fontSize: 32,
    color: colors.success, // Mint (#2EE6A6)
    marginTop: 4,
  },
  revenueIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "rgba(46, 230, 166, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  revenueFootText: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 12,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 14,
  },
  actionBtn: {
    flex: 1,
  },
  groupCard: {
    marginTop: 8,
    marginBottom: 12,
  },
  groupHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  groupTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupTitle: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  emptyText: {
    ...typography.caption,
    color: colors.textDim,
    fontStyle: "italic",
    paddingVertical: spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarInitials: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  memberMeta: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  endDateWrap: {
    alignItems: "flex-end",
  },
  endDateLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textDim,
    textTransform: "uppercase",
  },
  endDateValue: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginTop: 1,
  },
});