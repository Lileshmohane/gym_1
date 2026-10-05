import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { useCheckIn, useCheckOut, useMyAttendance } from "../../api/hooks";
import { colors, radius, spacing, typography } from "../../theme/tokens";

export default function PunchScreen() {
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const { data: history } = useMyAttendance();

  const openRecord = history?.find((r) => r.status === "OPEN");
  const [elapsed, setElapsed] = useState(0);
  const pillScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!openRecord) return;
    const start = new Date(openRecord.checkInAt).getTime();
    const interval = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [openRecord]);

  async function handleCheckIn(source: "QR_SELF" | "APP_BUTTON") {
    try {
      await checkIn.mutateAsync(source);
      Animated.spring(pillScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
      }).start();
    } catch {
      Alert.alert(
        "Check-in failed",
        "Couldn't record your visit. Confirm you're connected and try again."
      );
    }
  }

  async function handleCheckOut() {
    if (!openRecord) return;
    try {
      await checkOut.mutateAsync(openRecord.id);
      pillScale.setValue(0);
    } catch {
      Alert.alert(
        "Check-out failed",
        "Couldn't close your visit. Confirm you're connected and try again."
      );
    }
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.badgePill}>
          <Ionicons name="qr-code" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>ATTENDANCE</Text>
        </View>
        <Text style={styles.title}>Gym Check In</Text>
        <Text style={styles.subtitle}>Scan front desk QR code or tap below</Text>
      </View>

      <Card style={styles.card}>
        {!openRecord ? (
          <>
            <Pressable
              style={styles.qrbox}
              onPress={() => handleCheckIn("QR_SELF")}
            >
              <View style={styles.qrIconBox}>
                <Ionicons name="qr-code-outline" size={54} color={colors.primary} />
              </View>
              <Text style={styles.qrText}>Tap to scan{"\n"}gym QR code</Text>
            </Pressable>

            <Text style={styles.or}>— OR —</Text>

            <Button
              label="I'm Here (Quick Check-In)"
              icon="checkmark-circle-outline"
              variant="primary"
              onPress={() => handleCheckIn("APP_BUTTON")}
              style={{ width: "100%" }}
            />
          </>
        ) : (
          <View style={styles.activeVisitWrap}>
            <View style={styles.activePulseCircle}>
              <Ionicons name="fitness" size={32} color={colors.success} />
            </View>
            <Text style={styles.activeTitle}>Active Workout Session</Text>

            <Animated.View
              style={[styles.timerPill, { transform: [{ scale: pillScale }] }]}
            >
              <Ionicons name="timer-outline" size={24} color="#12141C" />
              <Text style={styles.timerText}>
                {mm}:{ss}
              </Text>
            </Animated.View>

            <Text style={styles.activeHint}>
              Session is actively being recorded
            </Text>

            <Button
              label="Check Out & Finish"
              variant="ghost"
              icon="exit-outline"
              style={{ width: "100%", marginTop: spacing.lg }}
              onPress={handleCheckOut}
            />
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
  },
  header: {
    marginBottom: spacing.lg,
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
  subtitle: {
    ...typography.body,
    fontSize: 14,
    color: colors.textDim,
    marginTop: 2,
  },
  card: {
    alignItems: "center",
    padding: spacing.xl,
  },
  qrbox: {
    width: 200,
    height: 200,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    backgroundColor: "rgba(124, 92, 255, 0.05)",
  },
  qrIconBox: {
    marginBottom: 10,
  },
  qrText: {
    textAlign: "center",
    color: colors.text,
    ...typography.h2,
    fontSize: 15,
  },
  or: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  activeVisitWrap: {
    alignItems: "center",
    width: "100%",
    paddingVertical: spacing.md,
  },
  activePulseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(46, 230, 166, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  activeTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.text,
    marginBottom: spacing.md,
  },
  timerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.success, // Mint (#2EE6A6)
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  timerText: {
    ...typography.stats,
    fontSize: 32,
    fontWeight: "800",
    color: "#12141C",
  },
  activeHint: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: spacing.md,
  },
});
