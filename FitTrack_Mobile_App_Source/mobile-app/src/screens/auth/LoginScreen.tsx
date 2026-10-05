import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/Button";
import { LoginAccountType, useLogin } from "../../api/hooks";
import { useAuthStore } from "../../store/authStore";
import { colors, radius, spacing, typography } from "../../theme/tokens";
import { gymImages } from "../../theme/images";

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<LoginAccountType>("GYM_ADMIN");
  const [open, setOpen] = useState(false);

  const ACCOUNT_OPTIONS = [
    {
      value: "GYM_ADMIN",
      label: "Gym Admin",
      desc: "Manage your gym, members, plans & check-ins",
      icon: "business-outline" as const,
    },
    {
      value: "MEMBER",
      label: "Gym Member",
      desc: "Check in with QR, view plan & payments",
      icon: "person-outline" as const,
    },
    {
      value: "PLATFORM_ADMIN",
      label: "Super Admin",
      desc: "Platform oversight & gym billing",
      icon: "shield-checkmark-outline" as const,
    },
  ] as const;

  const selected = ACCOUNT_OPTIONS.find((o) => o.value === accountType);
  const login = useLogin();
  const storeLogin = useAuthStore((s) => s.login);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing credentials", "Please enter both email and password.");
      return;
    }
    try {
      const data = await login.mutateAsync({ email: email.trim(), password, accountType });
      await storeLogin(data.user, data.accessToken, data.refreshToken);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      // Server returns a specific reason for a pending/rejected/disabled account.
      Alert.alert("Login failed", message ?? "Check your account type, email, and password and try again.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Real moody gym background image with fade-in and caching per Section 4 */}
      <Image
        source={{ uri: gymImages.loginBg }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
      />

      {/* Multi-stop dark gradient overlay for crystal clear contrast (4.5:1+) */}
      <LinearGradient
        colors={[
          "rgba(18, 20, 28, 0.45)",
          "rgba(18, 20, 28, 0.85)",
          "#12141C",
        ]}
        locations={[0, 0.45, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Athletic Gym Header */}
        <View style={styles.header}>
          <View style={styles.badgePill}>
            <Ionicons name="barbell" size={16} color="#FFFFFF" />
            <Text style={styles.badgeText}>FITTRACK PRO</Text>
          </View>
          <Text style={styles.title}>WELCOME BACK</Text>
          <Text style={styles.subtitle}>Sign in to access your workout workspace</Text>
        </View>

        {/* Login Card Container */}
        <View style={styles.cardContainer}>
          {/* Account Type Selector Trigger */}
          <Text style={styles.label}>SIGN IN AS</Text>
          <Pressable
            style={styles.dropdown}
            onPress={() => setOpen(true)}
            accessibilityRole="combobox"
          >
            <View style={styles.dropdownLeft}>
              <Ionicons
                name={selected?.icon ?? "person-outline"}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.dropdownText}>{selected?.label}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textDim} />
          </Pressable>

          {/* Account Type Modal */}
          <Modal
            visible={open}
            transparent
            animationType="fade"
            onRequestClose={() => setOpen(false)}
          >
            <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Choose Account Type</Text>
                {ACCOUNT_OPTIONS.map((opt) => {
                  const isSelected = accountType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.modalOption,
                        isSelected && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setAccountType(opt.value);
                        setOpen(false);
                      }}
                    >
                      <View style={styles.radioWrap}>
                        <View style={[styles.radio, isSelected && styles.radioActive]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </View>
                      <View style={styles.optionText}>
                        <Text style={[styles.optionLabel, isSelected && { color: colors.primary }]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.optionDesc}>{opt.desc}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </Pressable>
                  );
                })}
                <Button
                  label="Done"
                  variant="ghost"
                  onPress={() => setOpen(false)}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            </Pressable>
          </Modal>

          {/* Input Fields */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={20} color={colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="admin@gym.com"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textDim} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Primary Gradient Action Button */}
          <Button
            label={login.isPending ? "Signing In..." : "Sign In"}
            icon="log-in-outline"
            onPress={handleLogin}
            disabled={login.isPending}
            style={styles.submitBtn}
          />

          {/* Forgot password — WhatsApp OTP self-serve reset */}
          <Pressable
            onPress={() => navigation.navigate("ForgotPassword", { accountType })}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </Pressable>

          {/* Registration Link */}
          <Pressable
            onPress={() => navigation.navigate("RegisterGym")}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              New gym owner? <Text style={styles.registerHighlight}>Register as an admin</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 92, 255, 0.25)",
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    ...typography.display,
    fontSize: 34,
    color: colors.text,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.textDim,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  cardContainer: {
    backgroundColor: "rgba(30, 34, 48, 0.92)",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  label: {
    ...typography.label,
    fontSize: 11,
    color: colors.textDim,
    marginBottom: 6,
    marginTop: 4,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    marginBottom: spacing.md,
  },
  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    marginBottom: spacing.md,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 12,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  forgotLink: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  forgotText: {
    ...typography.body,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  registerText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textDim,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.display,
    fontSize: 22,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(124, 92, 255, 0.1)",
  },
  radioWrap: {
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
  },
  optionDesc: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
});
