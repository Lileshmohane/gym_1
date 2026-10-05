import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Button } from "../../components/Button";
import { LoginAccountType, useForgotPassword, useResetPassword } from "../../api/hooks";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialType: LoginAccountType = route.params?.accountType ?? "MEMBER";

  const forgot = useForgotPassword();
  const reset = useResetPassword();

  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState<LoginAccountType>(initialType);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const request = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Enter the email you registered with.");
      return;
    }
    try {
      await forgot.mutateAsync({ email: email.trim(), accountType });
      setCodeSent(true);
      Alert.alert(
        "Code sent",
        "If an account with a registered phone matches, a 6-digit WhatsApp code has been sent. Enter it below with your new password."
      );
    } catch {
      Alert.alert(
        "Could not send code",
        "Something went wrong. If your account has no phone number on file, ask your gym admin to reset it for you."
      );
    }
  };

  const submit = async () => {
    if (!/^\d{6}$/.test(otp)) {
      Alert.alert("Invalid code", "Enter the 6-digit code from WhatsApp.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Passwords don't match", "Re-enter the same password in both fields.");
      return;
    }
    try {
      const data = await reset.mutateAsync({ email: email.trim(), accountType, otp, newPassword: password });
      Alert.alert("Password reset", data.message, [{ text: "Back to login", onPress: () => navigation.navigate("Login") }]);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Alert.alert("Reset failed", message ?? "The code is invalid or has expired.");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>PASSWORD RESET</Text>
          <Text style={styles.title}>{codeSent ? "Enter your code" : "Forgot password?"}</Text>
          <Text style={styles.subtitle}>
            {codeSent
              ? "Check WhatsApp for a 6-digit code, then choose a new password."
              : "We'll send a one-time code over WhatsApp to the phone on your account. Only accounts with a registered phone can reset this way."}
          </Text>

          <Text style={styles.label}>Account email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!codeSent}
          />

          {!codeSent && (
            <View style={styles.typeRow}>
              {(["MEMBER", "GYM_ADMIN"] as LoginAccountType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setAccountType(t)}
                  style={[styles.typeChip, accountType === t && styles.typeChipActive]}
                >
                  <Text style={[styles.typeText, accountType === t && styles.typeTextActive]}>
                    {t === "MEMBER" ? "Member" : "Gym Admin"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {!codeSent ? (
            <>
              <Button
                label={forgot.isPending ? "Sending code..." : "Send WhatsApp code"}
                icon="logo-whatsapp"
                onPress={request}
                disabled={forgot.isPending}
                style={styles.action}
              />
              <Text style={styles.hint}>
                Gym owner or super admin with no phone on file? Ask your gym admin or platform operator to reset it for you.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.label}>6-digit code</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={colors.textDim}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={styles.label}>New password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textDim}
                secureTextEntry
              />
              <Text style={styles.label}>Confirm new password</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.textDim}
                secureTextEntry
              />
              <Button
                label={reset.isPending ? "Resetting..." : "Reset password"}
                icon="checkmark-circle-outline"
                onPress={submit}
                disabled={reset.isPending}
                style={styles.action}
              />
              <Pressable onPress={() => setCodeSent(false)} disabled={forgot.isPending} style={styles.secondary}>
                <Text style={styles.secondaryText}>Use a different email</Text>
              </Pressable>
            </>
          )}

          <Pressable onPress={() => navigation.navigate("Login")} style={styles.back}>
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={styles.backText}>Back to login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  eyebrow: { ...typography.label, fontSize: 11, color: colors.primary, marginBottom: spacing.xs },
  title: { ...typography.display, fontSize: 26, color: colors.text },
  subtitle: { ...typography.body, color: colors.textDim, marginTop: spacing.xs, marginBottom: spacing.md, lineHeight: 21 },
  label: { ...typography.label, fontSize: 11, color: colors.textDim, marginTop: spacing.sm, marginBottom: 6 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  typeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: "rgba(124, 92, 255, 0.12)" },
  typeText: { color: colors.textDim, fontWeight: "600" },
  typeTextActive: { color: colors.primary },
  action: { marginTop: spacing.lg },
  hint: { ...typography.caption, color: colors.textDim, marginTop: spacing.sm, textAlign: "center" },
  secondary: { alignItems: "center", paddingVertical: spacing.sm, marginTop: spacing.xs },
  secondaryText: { color: colors.textDim, fontSize: 13 },
  back: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: spacing.md },
  backText: { color: colors.primary, fontWeight: "600" },
});