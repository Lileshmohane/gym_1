import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useRegisterGym } from "../../api/hooks";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function RegisterGymScreen() {
  const navigation = useNavigation<any>();
  const registerGym = useRegisterGym();
  const [gymName, setGymName] = useState("");
  const [gymPhone, setGymPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submit = async () => {
    if (
      !gymName.trim() ||
      !gymPhone.trim() ||
      !ownerName.trim() ||
      !ownerEmail.trim() ||
      !password
    ) {
      Alert.alert("Missing details", "Complete all gym and administrator fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Password too short", "Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Enter the same password in both password fields.");
      return;
    }

    try {
      const result = await registerGym.mutateAsync({
        gymName: gymName.trim(),
        gymPhone: gymPhone.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        password,
      });
      // Self-registration no longer logs you in: the super admin must approve it.
      Alert.alert("Registration submitted", result.message, [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      Alert.alert("Registration failed", message ?? "Check the details and try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgePill}>
          <Ionicons name="barbell" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>GYM REGISTRATION</Text>
        </View>
        <Text style={styles.title}>Register Your Gym</Text>
        <Text style={styles.subtitle}>
          Set up your gym workspace and create your administrator login.
        </Text>

        <Card style={styles.card}>
          <Text style={styles.sectionHeading}>Facility Details</Text>
          <Text style={styles.label}>GYM NAME</Text>
          <TextInput
            value={gymName}
            onChangeText={setGymName}
            placeholder="e.g. Iron Fortress Fitness"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>GYM CONTACT PHONE</Text>
          <TextInput
            value={gymPhone}
            onChangeText={setGymPhone}
            placeholder="0300 1234567"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <View style={styles.divider} />
          <Text style={styles.sectionHeading}>Administrator Credentials</Text>

          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Your name"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>ADMIN EMAIL</Text>
          <TextInput
            value={ownerEmail}
            onChangeText={setOwnerEmail}
            placeholder="admin@yourgym.com"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            secureTextEntry
          />

          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            secureTextEntry
          />

          <Button
            label={registerGym.isPending ? "Submitting…" : "Submit for Approval"}
            icon="checkmark-circle-outline"
            onPress={submit}
            disabled={registerGym.isPending}
            style={styles.submit}
          />

          <Button
            label="Back to Login"
            variant="ghost"
            onPress={() => navigation.navigate("Login")}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 54, paddingBottom: spacing.xl },
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
  title: { ...typography.display, fontSize: 32, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textDim,
    fontSize: 14,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
  },
  sectionHeading: {
    ...typography.h2,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  label: {
    ...typography.label,
    fontSize: 11,
    color: colors.textDim,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  submit: { marginTop: spacing.lg, marginBottom: spacing.sm },
});