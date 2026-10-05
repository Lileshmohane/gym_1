import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../api/client";
import {
  useCreateGymMember,
  useEraseGymMemberData,
  useGymMembers,
  useMarkMemberAsLeft,
  useUpdateGymMember,
} from "../../api/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function MemberManagementScreen() {
  const token = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role);
  const isOwner = role === "GYM_OWNER";
  const { data, isLoading, isError, refetch } = useGymMembers();
  const createMember = useCreateGymMember();
  const markAsLeft = useMarkMemberAsLeft();
  const updateMember = useUpdateGymMember();
  const eraseMember = useEraseGymMemberData();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [editingMember, setEditingMember] = useState<{ id: number; name: string; phone: string | null } | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setShowForm(false);
  };

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Missing details", "Enter the member's name and email.");
      return;
    }

    try {
      const result = await createMember.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone,
      });
      resetForm();
      Alert.alert(
        "Member created",
        `${result.member.name} was added to this gym. Share this one-time password with them:\n\n${result.temporaryPassword}`
      );
    } catch (error) {
      const apiMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      Alert.alert("Couldn't create member", apiMessage ?? "Check the details and try again.");
    }
  };

  const deactivateMember = async (memberId: number) => {
    try {
      await markAsLeft.mutateAsync(memberId);
    } catch {
      Alert.alert("Couldn't update member", "The member could not be deactivated. Try again.");
    }
  };

  const saveMemberEdit = async () => {
    if (!editingMember || !editName.trim()) {
      Alert.alert("Name required", "Enter the member's name.");
      return;
    }
    try {
      await updateMember.mutateAsync({ id: editingMember.id, name: editName.trim(), phone: editPhone.trim() });
      setEditingMember(null);
    } catch {
      Alert.alert("Couldn't update member", "Check the details and try again.");
    }
  };

  const eraseMemberData = async (memberId: number) => {
    try {
      await eraseMember.mutateAsync(memberId);
    } catch {
      Alert.alert("Couldn't erase data", "The member data could not be erased. Try again.");
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.heading}>
        <View>
          <View style={styles.badgePill}>
            <Ionicons name="people" size={14} color={colors.primary} />
            <Text style={styles.badgeText}>MEMBERSHIP ROSTER</Text>
          </View>
          <Text style={styles.title}>Members</Text>
          <Text style={styles.subtitle}>{data?.totalElements ?? 0} registered in this gym</Text>
        </View>
        {!showForm && (
          <Button
            label="+ Add Member"
            size="sm"
            onPress={() => setShowForm(true)}
            style={styles.addButton}
          />
        )}
      </View>

      {showForm && (
        <Card style={styles.form}>
          <Text style={styles.sectionTitle}>Add New Gym Member</Text>
          <Text style={styles.formHint}>
            Add the basics now — the member completes their own profile and uploads a photo after signing in.
          </Text>

          <Text style={styles.label}>Full name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Member full name" style={styles.input} placeholderTextColor={colors.textDim} autoCapitalize="words" />
          <Text style={styles.label}>Email address</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="member@example.com" style={styles.input} placeholderTextColor={colors.textDim} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput value={phone} onChangeText={setPhone} placeholder="Mobile number" style={styles.input} placeholderTextColor={colors.textDim} keyboardType="phone-pad" />

          <View style={styles.formActions}>
            <Button label="Cancel" variant="ghost" size="sm" onPress={resetForm} style={styles.actionButton} disabled={createMember.isPending} />
            <Button label={createMember.isPending ? "Adding…" : "Create Member"} size="sm" onPress={submit} style={styles.actionButton} disabled={createMember.isPending} />
          </View>
        </Card>
      )}

      {isLoading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
      {isError && (
        <EmptyState
          icon="alert-circle-outline"
          iconColor={colors.warning}
          message="Couldn't load members."
        />
      )}
      {!isLoading && !isError && data?.content.length === 0 && (
        <EmptyState
          icon="people-outline"
          iconColor={colors.primary}
          message="No members yet. Add the first member to this gym."
        />
      )}
      {data?.content.map((member) => (
        <Card key={member.id} style={styles.memberRow}>
          <MemberAvatar memberId={member.id} name={member.name} hasPhoto={member.hasPhoto} token={token} />
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberMeta}>{member.email}</Text>
            {member.phone ? <Text style={styles.memberMeta}>{member.phone}</Text> : null}
          </View>
          <View style={styles.memberMetaColumn}>
            <View style={[styles.statusBadge, member.status === "ACTIVE" ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={[styles.statusText, member.status === "ACTIVE" ? styles.activeText : styles.inactiveText]}>
                {member.status === "ACTIVE" ? "Active" : "Inactive"}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setEditingMember(member);
                  setEditName(member.name);
                  setEditPhone(member.phone ?? "");
                }}
              >
                <Text style={styles.editAction}>Edit</Text>
              </TouchableOpacity>
              {isOwner && member.status === "ACTIVE" && (
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={markAsLeft.isPending}
                  onPress={() =>
                    Alert.alert(
                      "Mark member as left?",
                      `${member.name} will no longer be able to sign in, and active subscriptions will be cancelled.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Mark as left", style: "destructive", onPress: () => void deactivateMember(member.id) },
                      ]
                    )
                  }
                >
                  <Text style={styles.deactivate}>Deactivate</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Card>
      ))}
      {isError && <Button label="Retry" variant="ghost" onPress={() => refetch()} />}

      <Modal visible={editingMember !== null} transparent animationType="fade" onRequestClose={() => setEditingMember(null)}>
        <View style={styles.modalBackdrop}>
          <Card style={styles.editModal}>
            <Text style={styles.sectionTitle}>Edit Member Details</Text>
            <Text style={styles.label}>Full Name</Text>
            <TextInput value={editName} onChangeText={setEditName} style={styles.input} placeholderTextColor={colors.textDim} autoCapitalize="words" />
            <Text style={styles.label}>Phone</Text>
            <TextInput value={editPhone} onChangeText={setEditPhone} style={styles.input} placeholderTextColor={colors.textDim} keyboardType="phone-pad" />
            <View style={styles.formActions}>
              <Button label="Cancel" variant="ghost" size="sm" onPress={() => setEditingMember(null)} style={styles.actionButton} disabled={updateMember.isPending} />
              <Button label={updateMember.isPending ? "Saving…" : "Save"} size="sm" onPress={saveMemberEdit} style={styles.actionButton} disabled={updateMember.isPending} />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MemberAvatar({
  memberId,
  name,
  hasPhoto,
  token,
}: {
  memberId: number;
  name: string;
  hasPhoto: boolean;
  token: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const photoUrl = `${apiClient.defaults.baseURL}/members/${memberId}/photo`;

  if (hasPhoto && token && !failed) {
    return (
      <Image
        source={{ uri: photoUrl, headers: { Authorization: `Bearer ${token}` } }}
        onError={() => setFailed(true)}
        style={styles.avatar}
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.initials}>
        {name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 54, paddingBottom: spacing.xl },
  heading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: spacing.md,
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
  title: { ...typography.display, fontSize: 30, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textDim, marginTop: 2 },
  addButton: { paddingHorizontal: spacing.md },
  form: { marginBottom: spacing.lg, borderColor: colors.primary },
  sectionTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  formHint: { ...typography.caption, color: colors.textDim, marginTop: -spacing.sm, marginBottom: spacing.md },
  label: { ...typography.label, fontSize: 11, color: colors.textDim, marginBottom: 4, marginTop: spacing.sm },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  formActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  actionButton: { flex: 1 },
  loader: { marginTop: spacing.xl },
  memberRow: { flexDirection: "row", alignItems: "center", padding: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.border },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  initials: { color: colors.primary, fontWeight: "700", fontSize: 16 },
  memberDetails: { flex: 1, marginHorizontal: spacing.md },
  memberMetaColumn: { alignItems: "flex-end", gap: 6 },
  memberName: { ...typography.body, color: colors.text, fontWeight: "600" },
  memberMeta: { ...typography.caption, color: colors.textDim, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1 },
  activeBadge: { backgroundColor: "rgba(46, 230, 166, 0.15)", borderColor: "rgba(46, 230, 166, 0.4)" },
  inactiveBadge: { backgroundColor: "rgba(160, 166, 186, 0.15)", borderColor: "rgba(160, 166, 186, 0.4)" },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  activeText: { color: colors.success },
  inactiveText: { color: colors.textDim },
  rowActions: { flexDirection: "row", gap: 8 },
  editAction: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  deactivate: { ...typography.caption, color: colors.error, fontWeight: "600" },
  modalBackdrop: { flex: 1, justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(0,0,0,0.7)" },
  editModal: { marginBottom: 0 },
});