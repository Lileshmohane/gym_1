// WelcomeScreen — pre-auth landing page, restyled to match the marketing
// Home screen: full-bleed hero, overlapping stats strip, a "What we offer"
// gradient-card grid and a gradient CTA banner.
// Animation uses React Native's core Animated API (no Reanimated / expo-haptics
// / custom fonts are installed in this project, so we keep `expo start` working).
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/tokens";
import { gymImages } from "../../theme/images";

const C = {
  bg: colors.bg,
  card: colors.card,
  border: colors.border,
  primary: colors.primary,
  accent: colors.accent,
  success: colors.success,
  amber: colors.warning,
  text: colors.text,
  dim: colors.textDim,
};

const HERO_IMAGE = gymImages.loginBg;

const STATS = [
  { icon: "calendar", value: "3-day", label: "Expiry alerts" },
  { icon: "qr-code", value: "Instant", label: "QR check-in" },
  { icon: "shield-checkmark", value: "100%", label: "Data isolation" },
] as const;

type Feature = {
  id: number;
  name: string;
  desc: string;
  lib: "mci" | "ion";
  icon: string;
  colors: readonly [string, string];
};

const FEATURES: Feature[] = [
  { id: 1, name: "Member Management", desc: "Every member, plan and subscription in one place", lib: "mci", icon: "account-group", colors: ["#7C5CFF", "#5B3FE0"] },
  { id: 2, name: "Smart Reminders", desc: "Automatic WhatsApp nudges before a plan lapses", lib: "ion", icon: "notifications", colors: ["#FF6B4A", "#E0442A"] },
  { id: 3, name: "QR Check-ins", desc: "Self check-in or staff entry, history builds itself", lib: "ion", icon: "qr-code", colors: ["#38BDF8", "#2563EB"] },
  { id: 4, name: "Payments & Renewals", desc: "Track dues, renewals and expired plans instantly", lib: "mci", icon: "credit-card-check", colors: ["#2EE6A6", "#0E9F6E"] },
  { id: 5, name: "WhatsApp Alerts", desc: "Renewal and attendance alerts on autopilot", lib: "mci", icon: "whatsapp", colors: ["#25D366", "#128C7E"] },
  { id: 6, name: "Business Insights", desc: "Revenue, attendance and retention at a glance", lib: "mci", icon: "chart-line", colors: ["#F472B6", "#DB2777"] },
];

// Press feedback (scale spring) via core Animated.
function PressScale({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, friction: 4 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
  return (
    <Pressable onPressIn={press} onPressOut={release} onPress={() => onPress && onPress()}>
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// Mount entrance (fade + rise) with optional stagger delay.
function FadeInUp({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

function GradientButton({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return (
    <PressScale onPress={onPress}>
      <LinearGradient colors={[C.primary, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {icon ? <Ionicons name={icon as any} size={20} color="#fff" /> : null}
        <Text style={styles.btnText}>{label}</Text>
      </LinearGradient>
    </PressScale>
  );
}

function GhostButton({ label, icon, onPress }: { label: string; icon?: string; onPress?: () => void }) {
  return (
    <PressScale onPress={onPress} style={styles.ghost}>
      {icon ? <Ionicons name={icon as any} size={18} color={C.text} /> : null}
      <Text style={styles.ghostText}>{label}</Text>
    </PressScale>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={styles.secHead}>
      <Text style={styles.secTitle}>{title}</Text>
      {sub ? <Text style={styles.secSub}>{sub}</Text> : null}
    </View>
  );
}

function FeatureCard({ item, index }: { item: Feature; index: number }) {
  const Icon = item.lib === "mci" ? MaterialCommunityIcons : Ionicons;
  return (
    <FadeInUp delay={120 + index * 70} style={{ width: "48%" }}>
      <LinearGradient colors={item.colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.service}>
        <View style={styles.serviceIcon}>
          <Icon name={item.icon as any} size={26} color="#fff" />
        </View>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDesc}>{item.desc}</Text>
      </LinearGradient>
    </FadeInUp>
  );
}

function StatStrip() {
  return (
    <View style={styles.stats}>
      {STATS.map((s) => (
        <View key={s.label} style={styles.stat}>
          <Ionicons name={s.icon as any} size={18} color={C.primary} />
          <Text style={styles.statVal}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const go = (route: string) => navigation.navigate(route);

  const p = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(p, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(p, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const dot = {
    transform: [{ scale: p }],
    opacity: p.interpolate({ inputRange: [1, 1.6], outputRange: [1, 0.45] }),
  };

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
        <LinearGradient colors={["rgba(18,20,28,0.35)", "rgba(18,20,28,0.9)"]} style={StyleSheet.absoluteFill} />

        <View style={[styles.topRow, { paddingTop: insets.top + 16 }]}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Ionicons name="barbell" size={18} color="#fff" />
            </View>
            <Text style={styles.logo}>FITTRACK PRO</Text>
          </View>
          <View style={styles.openPill}>
            <Animated.View style={[styles.dot, dot]} />
            <Text style={styles.openText}>Live now</Text>
          </View>
        </View>

        <View style={styles.heroBottom}>
          <FadeInUp>
            <Text style={styles.eyebrow}>RUN YOUR GYM, NOT SPREADSHEETS</Text>
          </FadeInUp>
          <FadeInUp delay={80}>
            <Text style={styles.heroTitle}>Gym management, built for athletes.</Text>
          </FadeInUp>
          <FadeInUp delay={160}>
            <Text style={styles.heroSub}>
              FitTrack keeps every member current, nudges them before they lapse, and turns check-ins into
              automatic attendance — all in one dark, fast app.
            </Text>
          </FadeInUp>
          <FadeInUp delay={240}>
            <View style={styles.ctaRow}>
              <View style={{ flex: 1 }}>
                <GradientButton label="Create your gym" icon="flash" onPress={() => go("RegisterGym")} />
              </View>
              <GhostButton label="Sign in" icon="log-in-outline" onPress={() => go("Login")} />
            </View>
          </FadeInUp>
        </View>
      </View>

      <StatStrip />

      <SectionHeader title="What we offer" sub="Everything the front desk used to do on paper." />
      <View style={styles.grid}>
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.id} item={f} index={i} />
        ))}
      </View>

      <FadeInUp delay={200} style={styles.ctaWrap}>
        <LinearGradient colors={[C.primary, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
          <Text style={styles.ctaTitle}>Ready to run your gym?</Text>
          <Text style={styles.ctaSub}>Set up members, plans and check-ins in minutes. No card required.</Text>
          <PressScale onPress={() => go("RegisterGym")} style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Get started free</Text>
          </PressScale>
        </LinearGradient>
      </FadeInUp>

      <Pressable onPress={() => go("Login")} style={styles.footLink}>
        <Text style={styles.footLinkText}>Already have an account? Sign in</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  hero: {
    minHeight: 560,
    justifyContent: "space-between",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  logo: { color: "#fff", fontWeight: "800", fontSize: 15, letterSpacing: 1 },
  openPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(18,20,28,0.7)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  openText: { color: C.text, fontWeight: "700", fontSize: 12 },
  heroBottom: { padding: 20, paddingBottom: 28 },
  eyebrow: { color: C.primary, fontWeight: "700", fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  heroTitle: { color: C.text, fontWeight: "800", fontSize: 38, lineHeight: 42, letterSpacing: -0.5 },
  heroSub: { color: C.dim, fontWeight: "400", fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 360 },
  ctaRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  btn: { height: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  ghost: { height: 52, paddingHorizontal: 18, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border, backgroundColor: "rgba(30,34,48,0.8)" },
  ghostText: { color: C.text, fontWeight: "700", fontSize: 15 },
  stats: { flexDirection: "row", marginHorizontal: 20, marginBottom: 8, padding: 14, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, transform: [{ translateY: -24 }] },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { color: C.text, fontWeight: "800", fontSize: 20 },
  statLabel: { color: C.dim, fontWeight: "500", fontSize: 11, textAlign: "center" },
  secHead: { paddingHorizontal: 20, marginTop: 8, marginBottom: 14 },
  secTitle: { color: C.text, fontWeight: "800", fontSize: 28, letterSpacing: -0.4 },
  secSub: { color: C.dim, fontWeight: "400", fontSize: 14, marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20, rowGap: 14 },
  service: { minHeight: 168, borderRadius: 24, padding: 16, justifyContent: "flex-end" },
  serviceIcon: { position: "absolute", top: 16, left: 16, width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  serviceName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  serviceDesc: { color: "rgba(255,255,255,0.85)", fontWeight: "400", fontSize: 12, marginTop: 4, lineHeight: 17 },
  ctaWrap: { marginHorizontal: 20, marginTop: 28 },
  cta: { borderRadius: 28, padding: 24 },
  ctaTitle: { color: "#fff", fontWeight: "800", fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  ctaSub: { color: "rgba(255,255,255,0.9)", fontWeight: "400", fontSize: 14, lineHeight: 20, marginTop: 6 },
  ctaBtn: { alignSelf: "flex-start", marginTop: 16, backgroundColor: "#fff", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14 },
  ctaBtnText: { color: "#14161F", fontWeight: "700", fontSize: 15 },
  footLink: { alignItems: "center", marginTop: 22 },
  footLinkText: { color: C.primary, fontWeight: "700", fontSize: 14 },
});