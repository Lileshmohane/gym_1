// HomeScreen (member landing) — dark "Iron" theme adapted to this project.
// Deps used: expo-image, expo-linear-gradient, @expo/vector-icons,
// react-native-safe-area-context. Animation (press-scale, staggered entrance,
// pulsing dot) uses React Native's core Animated API so no extra native
// modules (Reanimated / expo-haptics) are required to run `expo start`.
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
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

// Marketing palette mapped onto the shared design tokens (single source of truth).
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

// Reuses the curated low-key gym hero photo already in the theme (swap for a real gym shot).
const HERO_IMAGE = gymImages.loginBg;

const STATS = [
  { icon: "people", value: "2,500+", label: "Members" },
  { icon: "barbell", value: "40+", label: "Trainers" },
  { icon: "calendar", value: "120", label: "Classes / week" },
  { icon: "time", value: "24/7", label: "Open" },
] as const;

type Service = {
  id: number;
  name: string;
  desc: string;
  lib: "mci" | "ion";
  icon: string;
  colors: readonly [string, string];
};

const SERVICES: Service[] = [
  { id: 1, name: "Strength Training", desc: "Free weights, machines and power racks", lib: "mci", icon: "weight-lifter", colors: ["#7C5CFF", "#5B3FE0"] },
  { id: 2, name: "Cardio Zone", desc: "Treadmills, bikes, rowers and HIIT", lib: "mci", icon: "run-fast", colors: ["#FF6B4A", "#E0442A"] },
  { id: 3, name: "Personal Training", desc: "One-to-one plans with certified coaches", lib: "ion", icon: "person", colors: ["#38BDF8", "#2563EB"] },
  { id: 4, name: "Yoga and Zumba", desc: "Group classes for every level", lib: "mci", icon: "yoga", colors: ["#2EE6A6", "#0E9F6E"] },
  { id: 5, name: "Diet and Nutrition", desc: "Meal plans made for your goal", lib: "ion", icon: "restaurant", colors: ["#FFC53D", "#F59E0B"] },
  { id: 6, name: "Steam and Recovery", desc: "Steam room, sauna and physio support", lib: "mci", icon: "spa", colors: ["#F472B6", "#DB2777"] },
];

type Plan = {
  id: number;
  name: string;
  price: string;
  per: string;
  perks: string[];
  best: boolean;
};

const PLANS: Plan[] = [
  { id: 1, name: "Monthly", price: "1,499", per: "/month", perks: ["Gym floor access", "Locker"], best: false },
  { id: 2, name: "Quarterly", price: "3,999", per: "/3 months", perks: ["All classes", "Diet chart", "Locker"], best: true },
  { id: 3, name: "Yearly", price: "11,999", per: "/year", perks: ["Personal trainer x 12", "All classes", "Steam room"], best: false },
];

// Press feedback (scale spring) via core Animated. Reanimated/haptics aren't
// dependencies here, so this keeps the tactile feel without adding native modules.
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

// Mount entrance (fade + rise) with an optional stagger delay, core Animated based.
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

function Hero({ onJoin, onTour }: { onJoin: () => void; onTour: () => void }) {
  const insets = useSafeAreaInsets();
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
    <View style={styles.hero}>
      <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
      <LinearGradient colors={["rgba(18,20,28,0.15)", "rgba(18,20,28,0.95)"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.topRow, { paddingTop: insets.top + 16 }]}>
        <View style={styles.openPill}>
          <Animated.View style={[styles.dot, dot]} />
          <Text style={styles.openText}>Open now</Text>
        </View>
        <Pressable style={styles.bell}>
          <Ionicons name="notifications-outline" size={22} color={C.text} />
          <View style={styles.badge} />
        </Pressable>
      </View>
      <View style={styles.heroBottom}>
        <Text style={styles.heroTitle}>Stronger every day.</Text>
        <Text style={styles.heroSub}>
          Expert trainers, modern equipment and classes for every fitness level, all in one place.
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ flex: 1 }}>
            <GradientButton label="Join now" icon="flash" onPress={onJoin} />
          </View>
          <PressScale onPress={onTour} style={styles.ghost}>
            <Ionicons name="play-circle-outline" size={20} color={C.text} />
            <Text style={styles.ghostText}>Free tour</Text>
          </PressScale>
        </View>
      </View>
    </View>
  );
}

function StatsStrip() {
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

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: string }) {
  return (
    <View style={styles.secHead}>
      <View style={{ flex: 1 }}>
        <Text style={styles.secTitle}>{title}</Text>
        {sub ? <Text style={styles.secSub}>{sub}</Text> : null}
      </View>
      {action ? <Text style={styles.link}>{action}</Text> : null}
    </View>
  );
}

function ServiceCard({ item, index, onPress }: { item: Service; index: number; onPress?: (s: Service) => void }) {
  const Icon = item.lib === "mci" ? MaterialCommunityIcons : Ionicons;
  return (
    <FadeInUp delay={index * 70} style={{ width: "48%" }}>
      <PressScale onPress={() => onPress && onPress(item)}>
        <LinearGradient colors={item.colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.service}>
          <View style={styles.serviceIcon}>
            <Icon name={item.icon as any} size={26} color="#fff" />
          </View>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDesc}>{item.desc}</Text>
        </LinearGradient>
      </PressScale>
    </FadeInUp>
  );
}

function PlanCard({ plan, onPress }: { plan: Plan; onPress?: (p: Plan) => void }) {
  return (
    <PressScale onPress={() => onPress && onPress(plan)} style={[styles.plan, plan.best && styles.planBest]}>
      {plan.best ? (
        <View style={styles.bestTag}>
          <Text style={styles.bestText}>Most popular</Text>
        </View>
      ) : null}
      <Text style={styles.planName}>{plan.name}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
        <Text style={styles.planPrice}>Rs {plan.price}</Text>
        <Text style={styles.planPer}> {plan.per}</Text>
      </View>
      {plan.perks.map((k) => (
        <View key={k} style={styles.perk}>
          <Ionicons name="checkmark-circle" size={16} color={C.success} />
          <Text style={styles.perkText}>{k}</Text>
        </View>
      ))}
    </PressScale>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  // Real destinations in this app: membership plans live on the "Plans" tab.
  const goPlans = () => navigation.navigate("Plans");
  // Marketing-only actions that don't have a screen yet degrade gracefully.
  const soon = (what: string) => Alert.alert(what, "This is part of the gym preview — coming soon.");

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <Hero onJoin={goPlans} onTour={() => soon("Free tour")} />
      <StatsStrip />

      <SectionHeader title="What we offer" sub="Everything you need to reach your goal" />
      <View style={styles.grid}>
        {SERVICES.map((s, i) => (
          <ServiceCard key={s.id} item={s} index={i} onPress={goPlans} />
        ))}
      </View>

      <SectionHeader title="Choose your plan" sub="No joining fee this month" action="Compare" />
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={PLANS}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
        renderItem={({ item }) => <PlanCard plan={item} onPress={goPlans} />}
      />

      <LinearGradient colors={[C.primary, C.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
        <Text style={styles.ctaTitle}>Your first session is free</Text>
        <Text style={styles.ctaSub}>Meet a trainer, try the equipment and get a plan built for you.</Text>
        <PressScale onPress={() => soon("Book free trial")} style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>Book free trial</Text>
        </PressScale>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  hero: { height: 460, justifyContent: "space-between", borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" },
  topRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20 },
  openPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(18,20,28,0.7)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  openText: { color: C.text, fontWeight: "700", fontSize: 12 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(18,20,28,0.7)", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 11, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent },
  heroBottom: { padding: 20, paddingBottom: 28 },
  heroTitle: { color: C.text, fontWeight: "800", fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  heroSub: { color: C.dim, fontWeight: "400", fontSize: 15, lineHeight: 22, marginTop: 8 },
  btn: { height: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  ghost: { height: 52, paddingHorizontal: 18, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border, backgroundColor: "rgba(30,34,48,0.8)" },
  ghostText: { color: C.text, fontWeight: "700", fontSize: 15 },
  stats: { flexDirection: "row", marginHorizontal: 20, marginBottom: 8, padding: 14, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, transform: [{ translateY: -24 }] },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { color: C.text, fontWeight: "800", fontSize: 22 },
  statLabel: { color: C.dim, fontWeight: "500", fontSize: 11, textAlign: "center" },
  secHead: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 20, marginTop: 20, marginBottom: 14 },
  secTitle: { color: C.text, fontWeight: "800", fontSize: 28, letterSpacing: -0.4 },
  secSub: { color: C.dim, fontWeight: "400", fontSize: 14 },
  link: { color: C.primary, fontWeight: "700", fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: 20, rowGap: 14 },
  service: { minHeight: 168, borderRadius: 24, padding: 16, justifyContent: "flex-end" },
  serviceIcon: { position: "absolute", top: 16, left: 16, width: 46, height: 46, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  serviceName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  serviceDesc: { color: "rgba(255,255,255,0.85)", fontWeight: "400", fontSize: 12, marginTop: 4, lineHeight: 17 },
  plan: { width: 240, backgroundColor: C.card, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: C.border },
  planBest: { borderColor: C.primary, borderWidth: 2 },
  bestTag: { alignSelf: "flex-start", backgroundColor: C.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  bestText: { color: "#fff", fontWeight: "700", fontSize: 11 },
  planName: { color: C.text, fontWeight: "700", fontSize: 16, marginBottom: 6 },
  planPrice: { color: C.text, fontWeight: "800", fontSize: 34, letterSpacing: -0.5 },
  planPer: { color: C.dim, fontWeight: "400", fontSize: 13, marginBottom: 6 },
  perk: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  perkText: { color: C.dim, fontWeight: "500", fontSize: 13 },
  cta: { marginHorizontal: 20, marginTop: 28, borderRadius: 28, padding: 24 },
  ctaTitle: { color: "#fff", fontWeight: "800", fontSize: 30, lineHeight: 34, letterSpacing: -0.4 },
  ctaSub: { color: "rgba(255,255,255,0.9)", fontWeight: "400", fontSize: 14, lineHeight: 20, marginTop: 6 },
  ctaBtn: { alignSelf: "flex-start", marginTop: 16, backgroundColor: "#fff", paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14 },
  ctaBtnText: { color: "#14161F", fontWeight: "700", fontSize: 15 },
});