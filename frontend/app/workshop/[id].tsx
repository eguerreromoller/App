import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api, Workshop } from "@/src/api";
import { getFavorites, toggleFavorite } from "@/src/favorites";
import { colors, radius, shadow, spacing, typography } from "@/src/theme";

export default function WorkshopDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [w, setW] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFav, setIsFav] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [ws, favs] = await Promise.all([api.workshop(id), getFavorites()]);
      setW(ws);
      setIsFav(favs.includes(id));
    } catch (e: any) {
      setError("No se pudo cargar el taller.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleFav = async () => {
    if (!w) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next = await toggleFavorite(w.id);
    setIsFav(next.includes(w.id));
  };

  const callPhone = () => {
    if (!w) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${w.phone}`);
  };

  const openWhatsApp = () => {
    if (!w || !w.whatsapp) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const num = w.whatsapp.replace(/[^\d]/g, "");
    const msg = encodeURIComponent(`Hola, encontré su taller en Vitrina Automotriz.`);
    Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  };

  const openDirections = () => {
    if (!w) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const q = encodeURIComponent(`${w.address}, ${w.comuna}, Chile`);
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${q}`
        : `https://www.google.com/maps/dir/?api=1&destination=${q}`;
    Linking.openURL(url);
  };

  const openWebsite = () => {
    if (!w?.website) return;
    Linking.openURL(w.website);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (error || !w) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>{error || "Sin datos"}</Text>
        <Pressable onPress={load} style={styles.retryBtn} testID="retry-btn">
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="workshop-detail">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: w.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent", "rgba(33,37,41,0.9)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroTopBar, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable
              style={styles.circleBtn}
              onPress={() => router.back()}
              testID="detail-back"
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={styles.circleBtn}
              onPress={onToggleFav}
              testID="detail-favorite"
            >
              <Ionicons
                name={isFav ? "heart" : "heart-outline"}
                size={22}
                color={isFav ? colors.error : "#FFFFFF"}
              />
            </Pressable>
          </View>
          <View style={styles.heroBottom}>
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color="#F59F00" />
              <Text style={styles.badgeText}>
                {w.rating.toFixed(1)} · {w.review_count} reseñas
              </Text>
            </View>
            <Text style={styles.heroName}>{w.name}</Text>
            <View style={styles.heroLoc}>
              <Ionicons name="location" size={14} color="#F8F9FA" />
              <Text style={styles.heroLocText}>
                {w.address}, {w.comuna}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Pills */}
        <View style={styles.actions}>
          <ActionPill
            icon="call"
            label="Llamar"
            onPress={callPhone}
            testID="action-call"
          />
          {!!w.whatsapp && (
            <ActionPill
              icon="logo-whatsapp"
              label="WhatsApp"
              onPress={openWhatsApp}
              testID="action-whatsapp"
            />
          )}
          <ActionPill
            icon="navigate"
            label="Cómo llegar"
            onPress={openDirections}
            testID="action-directions"
          />
          {!!w.website && (
            <ActionPill
              icon="globe"
              label="Web"
              onPress={openWebsite}
              testID="action-web"
            />
          )}
        </View>

        {/* Description */}
        <Section title="Descripción">
          <Text style={styles.body}>{w.description}</Text>
        </Section>

        {/* Services */}
        {w.services.length > 0 && (
          <Section title="Servicios ofrecidos">
            <View style={styles.chipWrap}>
              {w.services.map((s) => (
                <View key={s} style={styles.serviceChip}>
                  <Text style={styles.serviceChipText}>{s}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Hours */}
        {Object.keys(w.hours).length > 0 && (
          <Section title="Horario de atención">
            {Object.entries(w.hours).map(([k, v]) => (
              <View key={k} style={styles.hourRow}>
                <Text style={styles.hourKey}>{k}</Text>
                <Text style={styles.hourVal}>{v}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Contact info */}
        <Section title="Contacto">
          <ContactRow icon="call" label={w.phone} onPress={callPhone} testID="contact-phone" />
          {!!w.email && (
            <ContactRow
              icon="mail"
              label={w.email}
              onPress={() => Linking.openURL(`mailto:${w.email}`)}
              testID="contact-email"
            />
          )}
          <ContactRow
            icon="location"
            label={`${w.address}, ${w.comuna}`}
            onPress={openDirections}
            testID="contact-address"
          />
        </Section>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.stickyCta, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable style={styles.ctaBtn} onPress={callPhone} testID="cta-contact">
          <Ionicons name="call" size={18} color={colors.onBrandPrimary} />
          <Text style={styles.ctaText}>Contactar taller</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ActionPill({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable style={styles.pill} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={18} color={colors.brandPrimary} />
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

function ContactRow({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable style={styles.contactRow} onPress={onPress} testID={testID}>
      <View style={styles.contactIconBox}>
        <Ionicons name={icon} size={18} color={colors.brandPrimary} />
      </View>
      <Text style={styles.contactText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, gap: spacing.md },
  heroWrap: { height: 320, backgroundColor: colors.surfaceInverse, overflow: "hidden" },
  heroTopBar: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBottom: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: typography.sm, fontWeight: "700", color: colors.onSurface },
  heroName: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: spacing.sm,
    letterSpacing: -0.5,
  },
  heroLoc: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  heroLocText: { color: "#F8F9FA", fontSize: typography.base },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary,
    borderWidth: 1,
    borderColor: colors.brandTertiary,
  },
  pillText: { color: colors.onBrandSecondary, fontWeight: "700", fontSize: typography.base },

  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 0.5,
    borderTopColor: colors.divider,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: "800",
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  body: { fontSize: typography.base, color: colors.onSurfaceSecondary, lineHeight: 22 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  serviceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
  },
  serviceChipText: { color: colors.onSurface, fontSize: typography.sm, fontWeight: "600" },

  hourRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  hourKey: { color: colors.onSurfaceSecondary, fontSize: typography.base },
  hourVal: { color: colors.onSurface, fontSize: typography.base, fontWeight: "600" },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  contactIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: { flex: 1, color: colors.onSurface, fontSize: typography.base, fontWeight: "500" },

  stickyCta: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.brandPrimary,
  },
  ctaText: { color: colors.onBrandPrimary, fontSize: typography.lg, fontWeight: "800" },
  retryBtn: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  retryText: { color: colors.onBrandPrimary, fontWeight: "700" },
});
