import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../../api/client";
import {
  useMyMemberProfile,
  useUpdateMyMemberProfile,
  useUploadMyMemberPhoto,
} from "../../api/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();
  const isGymAdmin = user?.role === "GYM_OWNER" || user?.role === "GYM_STAFF";
  const isMember = user?.role === "MEMBER";

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      {/* Members maintain their own profile + photo; everyone else sees a summary. */}
      {isMember ? (
        <MemberSelfProfile />
      ) : (
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.slice(0, 2).toUpperCase() ?? "ME"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user?.name ?? "User"}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{user?.role?.replace("_", " ") ?? "MEMBER"}</Text>
            </View>
            <Text style={styles.email}>
              {user?.gymId ? `Gym Workspace: #${user.gymId}` : "Platform Oversight"}
            </Text>
          </View>
        </Card>
      )}

      {/* Settings Navigation List */}
      <Card style={styles.menuCard}>
        {isGymAdmin && (
          <Row
            icon="business-outline"
            label="Gym Profile"
            onPress={() => navigation.navigate("GymProfile")}
          />
        )}
        <Row
          icon="notifications-outline"
          label="Notification Settings"
          onPress={() => navigation.navigate("NotificationSettings")}
        />
        <Row
          icon="log-out-outline"
          label="Log Out"
          danger
          onPress={logout}
          last
        />
      </Card>
    </ScrollView>
  );
}

// The member's editable profile: name + phone, plus self-service photo upload.
// This is the "candidate side" of onboarding — the gym owner only creates the
// account, and the member fills in the rest here.
function MemberSelfProfile() {
  const { user, accessToken, refreshToken, login } = useAuthStore();
  const { data, isLoading, isError, refetch } = useMyMemberProfile();
  const updateProfile = useUpdateMyMemberProfile();
  const uploadPhoto = useUploadMyMemberPhoto();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setPhone(data.phone ?? "");
      setDirty(false);
    }
  }, [data]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;

    setPhotoBusy(true);
    try {
      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      if (asset.width > 1200) context.resize({ width: 1200 });
      const rendered = await context.renderAsync();
      const jpeg = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.78 });
      await uploadPhoto.mutateAsync({ uri: jpeg.uri, name: "member-photo.jpg", type: "image/jpeg" });
      Alert.alert("Photo updated", "Your profile photo has been saved.");
    } catch {
      Alert.alert("Photo unavailable", "Choose another image and try again.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter your name.");
      return;
    }
    try {
      const saved = await updateProfile.mutateAsync({ name: name.trim(), phone });
      // Keep the session's display name in sync (used across the app's headers).
      if (user && accessToken && refreshToken && saved.name !== user.name) {
        await login({ ...user, name: saved.name }, accessToken, refreshToken);
      }
      setDirty(false);
      Alert.alert("Profile updated", "Your changes have been saved.");
    } catch {
      Alert.alert("Couldn't save profile", "Check your details and try again.");
    }
  };

  if (isLoading) {
    return (
      <Card style={styles.userCard}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.name}>Couldn't load your profile</Text>
          <Text style={styles.email}>Check your connection and try again.</Text>
        </View>
        <Button label="Retry" variant="ghost" size="sm" onPress={() => refetch()} />
      </Card>
    );
  }

  return (
    <Card style={styles.memberCard}>
      <View style={styles.memberPhotoRow}>
        <MyPhoto hasPhoto={data.hasPhoto} token={accessToken} initials={initialsOf(data.name)} />
        <View style={styles.memberPhotoCopy}>
          <Text style={styles.photoTitle}>
            {data.hasPhoto ? "Update your photo" : "Add a profile photo"}
          </Text>
          <Text style={styles.photoHint}>Shown to gym staff at front-desk check-in.</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={pickPhoto}
            disabled={photoBusy}
            style={styles.photoAction}
          >
            <Ionicons name="camera-outline" size={16} color={colors.primary} />
            <Text style={styles.photoActionText}>
              {photoBusy ? "Uploading…" : data.hasPhoto ? "Change photo" : "Upload photo"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.label}>Full name</Text>
      <TextInput
        value={name}
        onChangeText={(value) => {
          setName(value);
          setDirty(true);
        }}
        placeholder="Your full name"
        style={styles.input}
        placeholderTextColor={colors.textDim}
        autoCapitalize="words"
      />
      <Text style={styles.label}>Phone</Text>
      <TextInput
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          setDirty(true);
        }}
        placeholder="Mobile number"
        style={styles.input}
        placeholderTextColor={colors.textDim}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Email (managed by your gym)</Text>
      <Text style={styles.readonlyValue}>{data.email}</Text>

      <View style={styles.memberSaveRow}>
        <Button
          label={updateProfile.isPending ? "Saving…" : "Save changes"}
          size="sm"
          onPress={save}
          style={styles.actionButton}
          disabled={updateProfile.isPending || !dirty}
        />
      </View>
    </Card>
  );
}

// Renders the member's own photo from the authenticated /members/me/photo
// endpoint, falling back to their initials if none has been uploaded yet.
function MyPhoto({
  hasPhoto,
  token,
  initials,
}: {
  hasPhoto: boolean;
  token: string | null;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [hasPhoto]);

  if (hasPhoto && token && !failed) {
    const uri = `${apiClient.defaults.baseURL}/members/me/photo`;
    return (
      <Image
        source={{ uri, headers: { Authorization: `Bearer ${token}` } }}
        onError={() => setFailed(true)}
        style={styles.avatar}
      />
    );
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function initialsOf(name: string) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "ME";
}

function Row({
  icon,
  label,
  danger,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowBorder,
        pressed && { backgroundColor: "rgba(255,255,255,0.03)" },
      ]}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.rowIconBox,
            { backgroundColor: danger ? "rgba(255, 77, 109, 0.15)" : "rgba(124, 92, 255, 0.15)" },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={danger ? colors.error : colors.primary}
          />
        </View>
        <Text style={[styles.rowLabel, danger && { color: colors.error }]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.display,
    fontSize: 30,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
  },
  name: {
    ...typography.h2,
    fontSize: 18,
    color: colors.text,
  },
  rolePill: {
    backgroundColor: "rgba(124, 92, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  email: {
    ...typography.caption,
    color: colors.textDim,
    fontSize: 13,
  },
  menuCard: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowIconBox: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  memberCard: { padding: spacing.md, marginBottom: spacing.lg },
  memberPhotoRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.md },
  memberPhotoCopy: { flex: 1 },
  avatarFallback: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  photoTitle: { ...typography.body, fontWeight: "600", color: colors.text },
  photoHint: { ...typography.caption, color: colors.textDim, marginTop: 2 },
  photoAction: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  photoActionText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
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
  readonlyValue: { ...typography.body, color: colors.textDim, marginTop: 4 },
  memberSaveRow: { marginTop: spacing.lg },
  actionButton: { flex: 1 },
});
