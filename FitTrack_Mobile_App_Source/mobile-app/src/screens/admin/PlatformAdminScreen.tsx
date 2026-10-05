import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  useAdminChargeGym,
  useAdminCreateGym,
  useAdminDashboard,
  useAdminGyms,
  useAdminRegistrations,
  useAdminApproveRegistration,
  useAdminRejectRegistration,
  useAdminUpdateGym,
  useAdminDeleteGym,
  useAdminSetGymStatus,
  useAdminSetGymFee,
  AdminGym,
} from "../../api/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { NotificationBell, NotificationModal } from "../../components/NotificationModal";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { gymImages } from "../../theme/images";

export default function PlatformAdminScreen() {
  const { data: dashboard, isLoading: dashLoading } = useAdminDashboard();
  const { data: gyms, isLoading: gymsLoading, isError, refetch } = useAdminGyms();
  const { data: registrations } = useAdminRegistrations();
  const setStatus = useAdminSetGymStatus();
  const setFee = useAdminSetGymFee();
  const charge = useAdminChargeGym();
  const createGym = useAdminCreateGym();
  const approve = useAdminApproveRegistration();
  const reject = useAdminRejectRegistration();
  const updateGym = useAdminUpdateGym();
  const deleteGym = useAdminDeleteGym();

  const [showForm, setShowForm] = useState(false);
  const [gymName, setGymName] = useState("");
  const [gymPhone, setGymPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  // When set, the shared form edits an existing gym instead of creating one.
  const [editingGymId, setEditingGymId] = useState<number | null>(null);
  const [feeEditGymId, setFeeEditGymId] = useState<number | null>(null);
  const [feeAmount, setFeeAmount] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  function resetForm() {
    setGymName("");
    setGymPhone("");
    setOwnerName("");
    setOwnerEmail("");
    setPassword("");
    setEditingGymId(null);
  }

  function startEdit(gym: AdminGym) {
    setEditingGymId(gym.gymId);
    setGymName(gym.gymName);
    setGymPhone(gym.gymPhone);
    setOwnerName(gym.ownerName ?? "");
    setOwnerEmail(gym.ownerEmail ?? "");
    setPassword("");
    setShowForm(true);
  }

  async function handleApprove(gym: AdminGym) {
    try {
      await approve.mutateAsync(gym.gymId);
      Alert.alert("Approved", `${gym.gymName} can now sign in as a gym administrator.`);
    } catch {
      Alert.alert("Action failed", "Couldn't approve this registration.");
    }
  }

  function handleReject(gym: AdminGym) {
    Alert.alert(
      "Reject registration",
      `Reject the registration for ${gym.gymName}? Its admin won't be able to sign in.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await reject.mutateAsync({ gymId: gym.gymId, note: "Rejected by the platform administrator." });
            } catch {
              Alert.alert("Action failed", "Couldn't reject this registration.");
            }
          },
        },
      ]
    );
  }

  function handleDelete(gym: AdminGym) {
    Alert.alert(
      "Delete gym",
      `Permanently delete ${gym.gymName} and all of its data (members, plans, payments, attendance)? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGym.mutateAsync(gym.gymId);
            } catch {
              Alert.alert("Delete failed", "Couldn't delete this gym.");
            }
          },
        },
      ]
    );
  }

  async function handleToggle(gym: AdminGym) {
    const next = gym.gymStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await setStatus.mutateAsync({ gymId: gym.gymId, status: next });
    } catch {
      Alert.alert("Action failed", "Couldn't update the gym status.");
    }
  }

  async function handleCharge(gym: AdminGym) {
    const amount = gym.feeAmount ?? 2500;
    try {
      await charge.mutateAsync(gym.gymId);
      Alert.alert("Charged", `${gym.gymName}: period extended by one month (₹${amount.toLocaleString("en-IN")}).`);
    } catch {
      Alert.alert("Charge failed", "Couldn't record the monthly charge.");
    }
  }

  function startFeeEdit(gym: AdminGym) {
    setFeeEditGymId(gym.gymId);
    setFeeAmount(String(gym.feeAmount ?? 2500));
  }

  async function handleFeeSave(gym: AdminGym) {
    const amount = Number(feeAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(feeAmount.trim())) {
      Alert.alert("Invalid fee", "Enter a positive amount with up to 2 decimal places.");
      return;
    }
    try {
      await setFee.mutateAsync({ gymId: gym.gymId, amount });
      setFeeEditGymId(null);
      setFeeAmount("");
    } catch {
      Alert.alert("Update failed", "Couldn't update this gym's monthly fee.");
    }
  }

  async function handleCreate() {
    if (!gymName.trim() || !gymPhone.trim() || !ownerName.trim()) {
      Alert.alert("Check details", "Enter gym name, phone, and owner name.");
      return;
    }
    try {
      if (editingGymId != null) {
        await updateGym.mutateAsync({
          gymId: editingGymId,
          gymName: gymName.trim(),
          gymPhone: gymPhone.trim(),
          ownerName: ownerName.trim(),
        });
        setShowForm(false);
        resetForm();
        return;
      }
      if (!ownerEmail.trim() || password.length < 8) {
        Alert.alert("Check details", "Owner email and a password of 8+ characters are required to create a gym.");
        return;
      }
      await createGym.mutateAsync({
        gymName: gymName.trim(),
        gymPhone: gymPhone.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        password,
      });
      setShowForm(false);
      resetForm();
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      Alert.alert(editingGymId != null ? "Couldn't update gym" : "Couldn't create gym", message ?? "Check the details and try again.");
    }
  }

  if (dashLoading || gymsLoading)
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );

  if (isError)
    return (
      <View style={[styles.screen, { padding: spacing.lg, justifyContent: "center" }]}>
        <EmptyState
          icon="alert-circle-outline"
          iconColor={colors.warning}
          message="Couldn't load the platform admin dashboard."
        />
        <Button label="Retry" variant="ghost" onPress={() => refetch()} style={{ marginTop: spacing.md }} />
      </View>
    );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gym Background Hero Backdrop */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: gymImages.superAdminBg }}
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

          <View style={styles.topBar}>
            <View>
              <View style={styles.badgePill}>
                <Ionicons name="shield" size={14} color={colors.primary} />
                <Text style={styles.badgeText}>PLATFORM OVERVIEW</Text>
              </View>
              <Text style={styles.title}>Super Admin</Text>
            </View>
            <NotificationBell unreadCount={1} onPress={() => setNotifOpen(true)} />
          </View>
        </View>

        <View style={styles.body}>
          {dashboard && (
            <View style={styles.grid}>
              <Metric label="Total gyms" value={dashboard.totalGyms} icon="business" color={colors.primary} />
              <Metric label="Active gyms" value={dashboard.activeGyms} icon="checkmark-circle" color={colors.success} />
              <Metric label="Expiring" value={dashboard.expiringGyms} icon="time" color={colors.warning} />
              <Metric label="Expired" value={dashboard.expiredGyms} icon="alert-circle" color={colors.error} />
            </View>
          )}

          {/* Revenue Card */}
          <Card style={styles.revenueCard}>
            <View style={styles.revenueTop}>
              <View>
                <Text style={styles.revenueLabel}>Monthly platform revenue</Text>
                <Text style={styles.revenueValue}>
                  ₹{(dashboard?.monthlyRevenue ?? 0).toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={styles.revenueIconBox}>
                <Ionicons name="cash-outline" size={26} color={colors.success} />
              </View>
            </View>
          </Card>

          {/* Pending approval requests from self-registered admins */}
          {registrations && registrations.length > 0 && (
            <>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Pending Approval ({registrations.length})</Text>
              </View>
              {registrations.map((gym) => (
                <Card key={gym.gymId} style={styles.gymCard}>
                  <View style={styles.gymTop}>
                    <View style={styles.gymTitleRow}>
                      <View style={styles.gymIconBox}>
                        <Ionicons name="hourglass-outline" size={18} color={colors.warning} />
                      </View>
                      <Text style={styles.gymName}>{gym.gymName}</Text>
                    </View>
                    <ApprovalBadge status={gym.approvalStatus} />
                  </View>

                  <Text style={styles.ownerText}>
                    {gym.ownerName ?? "No owner"} · {gym.ownerEmail ?? "no email"}
                  </Text>
                  {gym.approvalNote ? (
                    <Text style={styles.ownerText}>Note: {gym.approvalNote}</Text>
                  ) : null}

                  <View style={styles.actions}>
                    <Button
                      label="Approve"
                      variant="success"
                      size="sm"
                      icon="checkmark-circle-outline"
                      onPress={() => handleApprove(gym)}
                      style={styles.actionBtn}
                      disabled={approve.isPending}
                    />
                    <Button
                      label="Reject"
                      variant="ghost"
                      size="sm"
                      icon="close-circle-outline"
                      onPress={() => handleReject(gym)}
                      style={styles.actionBtn}
                      disabled={reject.isPending}
                    />
                  </View>
                </Card>
              ))}
            </>
          )}

          {/* Section Heading + Create Gym */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Gyms & Administrators</Text>
            <Button
              label={showForm ? "Close Form" : "+ Add Gym"}
              variant={showForm ? "ghost" : "accent"}
              size="sm"
              onPress={() => {
                if (showForm) resetForm();
                setShowForm((v) => !v);
              }}
            />
          </View>

          {showForm && (
            <Card style={styles.formCard}>
              <Text style={styles.formTitle}>
                {editingGymId != null ? "Edit Gym Workspace" : "Register New Gym Workspace"}
              </Text>
              <Field label="Gym Name" value={gymName} onChangeText={setGymName} placeholder="e.g. Iron Forge Gym" />
              <Field label="Gym Phone" value={gymPhone} onChangeText={setGymPhone} placeholder="0300 1234567" keyboardType="phone-pad" />
              <Field label="Owner Full Name" value={ownerName} onChangeText={setOwnerName} placeholder="Owner Name" />
              {editingGymId == null && (
                <>
                  <Field label="Owner Email" value={ownerEmail} onChangeText={setOwnerEmail} placeholder="owner@email.com" keyboardType="email-address" />
                  <Field label="Temporary Password" value={password} onChangeText={setPassword} placeholder="min 8 characters" secure />
                </>
              )}
              <Button
                label={
                  editingGymId != null
                    ? updateGym.isPending
                      ? "Saving…"
                      : "Save Changes"
                    : createGym.isPending
                    ? "Creating…"
                    : "Create Gym Admin"
                }
                onPress={handleCreate}
                disabled={updateGym.isPending || createGym.isPending}
                style={{ marginTop: spacing.md }}
              />
            </Card>
          )}

          {gyms?.length === 0 && (
            <EmptyState
              icon="barbell-outline"
              iconColor={colors.primary}
              message="No approved gyms on the platform yet."
            />
          )}

          {gyms?.map((gym) => (
            <Card key={gym.gymId} style={styles.gymCard}>
              <View style={styles.gymTop}>
                <View style={styles.gymTitleRow}>
                  <View style={styles.gymIconBox}>
                    <Ionicons name="barbell" size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.gymName}>{gym.gymName}</Text>
                </View>
                <FeeBadge status={gym.feeStatus} />
              </View>

              <Text style={styles.ownerText}>
                {gym.ownerName ?? "No owner"} · {gym.ownerEmail ?? "no email"}
              </Text>

              <View style={styles.gymMetaBar}>
                <Text style={styles.metaText}>
                  Status: <Text style={styles.metaBold}>{gym.gymStatus}</Text>
                </Text>
                <Text style={styles.metaText}>
                  Fee: <Text style={styles.metaBold}>₹{(gym.feeAmount ?? 2500).toLocaleString("en-IN")}/mo</Text>
                </Text>
                <Text style={styles.metaText}>
                  Due: <Text style={styles.metaBold}>{gym.periodEnd ?? "—"}</Text>
                </Text>
              </View>

              <View style={styles.actions}>
                <Button
                  label={gym.gymStatus === "ACTIVE" ? "Suspend" : "Activate"}
                  variant="ghost"
                  size="sm"
                  onPress={() => handleToggle(gym)}
                  style={styles.actionBtn}
                  disabled={setStatus.isPending}
                />
                <Button
                  label={`Charge ₹${(gym.feeAmount ?? 2500).toLocaleString("en-IN")}`}
                  variant="primary"
                  size="sm"
                  onPress={() => handleCharge(gym)}
                  style={styles.actionBtn}
                  disabled={charge.isPending}
                />
              </View>

              <View style={styles.actions}>
                <Button
                  label="Edit"
                  variant="secondary"
                  size="sm"
                  icon="create-outline"
                  onPress={() => startEdit(gym)}
                  style={styles.actionBtn}
                />
                <Button
                  label="Fee"
                  variant="secondary"
                  size="sm"
                  icon="cash-outline"
                  onPress={() => startFeeEdit(gym)}
                  style={styles.actionBtn}
                />
                <Button
                  label="Delete"
                  variant="ghost"
                  size="sm"
                  icon="trash-outline"
                  textColor={colors.error}
                  onPress={() => handleDelete(gym)}
                  style={styles.actionBtn}
                />
              </View>

              {feeEditGymId === gym.gymId && (
                <View style={styles.feeEditor}>
                  <Field
                    label="Monthly platform fee (₹)"
                    value={feeAmount}
                    onChangeText={setFeeAmount}
                    placeholder="2500"
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.actions}>
                    <Button
                      label={setFee.isPending ? "Saving…" : "Save Fee"}
                      variant="primary"
                      size="sm"
                      onPress={() => handleFeeSave(gym)}
                      disabled={setFee.isPending}
                      style={styles.actionBtn}
                    />
                    <Button
                      label="Cancel"
                      variant="ghost"
                      size="sm"
                      onPress={() => setFeeEditGymId(null)}
                      style={styles.actionBtn}
                    />
                  </View>
                </View>
              )}
            </Card>
          ))}

          <Button
            label="Refresh Platform Data"
            variant="ghost"
            icon="refresh"
            onPress={() => refetch()}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>

      <NotificationModal visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}

function ApprovalBadge({ status }: { status: string | null }) {
  const color =
    status === "REJECTED"
      ? colors.error
      : status === "PENDING"
      ? colors.warning
      : colors.success;

  return (
    <View style={[styles.feeBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
      <Text style={[styles.feeBadgeText, { color }]}>{status ?? "—"}</Text>
    </View>
  );
}

function FeeBadge({ status }: { status: string | null }) {
  const color =
    status === "EXPIRED"
      ? colors.error
      : status === "EXPIRING"
      ? colors.warning
      : colors.success;

  return (
    <View style={[styles.feeBadge, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
      <Text style={[styles.feeBadgeText, { color }]}>{status ?? "—"}</Text>
    </View>
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

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "email-address" | "phone-pad" | "decimal-pad" | "default";
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textDim}
        keyboardType={props.keyboardType ?? "default"}
        secureTextEntry={props.secure}
        style={styles.input}
      />
    </View>
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
  badgePill: {
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
  badgeText: {
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
    borderColor: "rgba(124, 92, 255, 0.3)",
  },
  revenueTop: {
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
    color: colors.text,
    marginTop: 4,
  },
  revenueIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "rgba(46, 230, 166, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.text,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderColor: colors.primary,
  },
  formTitle: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  field: {
    marginTop: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    fontSize: 11,
    color: colors.textDim,
    marginBottom: 4,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  gymCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  feeEditor: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  gymTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gymTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  gymIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(124, 92, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  gymName: {
    ...typography.h2,
    fontSize: 17,
    color: colors.text,
    flex: 1,
  },
  feeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  feeBadgeText: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
  },
  ownerText: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 8,
  },
  gymMetaBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  metaText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textDim,
  },
  metaBold: {
    color: colors.text,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
