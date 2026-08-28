import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LEGAL, LegalBlock } from "@/src/legal";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function LegalScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const data = LEGAL[doc || "privacidad"] || LEGAL.privacidad;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="legal-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="legal-back">
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {doc === "terminos" ? "Términos de Uso" : "Política de Privacidad"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}>
        <Text style={styles.docTitle}>{data.title}</Text>
        <Text style={styles.entity}>{data.entity}</Text>
        <View style={styles.updatedPill}>
          <Ionicons name="time-outline" size={12} color={colors.onBrandSecondary} />
          <Text style={styles.updatedText}>{data.updated}</Text>
        </View>

        {data.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}

        <View style={styles.contactBox}>
          <Ionicons name="mail-outline" size={18} color={colors.brandPrimary} />
          <Text style={styles.contactText}>Consultas: contacto@vitrinaautomotriz.cl</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.t) {
    case "h1":
      return <Text style={styles.h1}>{block.text}</Text>;
    case "h2":
      return <Text style={styles.h2}>{block.text}</Text>;
    case "strong":
      return (
        <View style={styles.strongBox}>
          <Text style={styles.strongText}>{block.text}</Text>
        </View>
      );
    case "bullet":
      return (
        <View style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{block.text}</Text>
        </View>
      );
    default:
      return <Text style={styles.p}>{block.text}</Text>;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: { flex: 1, fontSize: typography.xl, fontWeight: "800", color: colors.onSurface },
  docTitle: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  entity: { fontSize: typography.base, color: colors.onSurfaceSecondary, marginTop: 4 },
  updatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colors.brandSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  updatedText: { fontSize: typography.sm, color: colors.onBrandSecondary, fontWeight: "600" },
  h1: { fontSize: typography.lg, fontWeight: "800", color: colors.onSurface, marginTop: spacing.lg, marginBottom: spacing.xs },
  h2: { fontSize: typography.base, fontWeight: "700", color: colors.onSurfaceTertiary, marginTop: spacing.md, marginBottom: spacing.xs },
  p: { fontSize: typography.base, color: colors.onSurfaceSecondary, lineHeight: 22, marginTop: spacing.xs },
  bulletRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, paddingRight: spacing.sm },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brandPrimary, marginTop: 8 },
  bulletText: { flex: 1, fontSize: typography.base, color: colors.onSurfaceSecondary, lineHeight: 22 },
  strongBox: {
    backgroundColor: colors.brandSecondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.brandPrimary,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  strongText: { fontSize: typography.base, color: colors.onBrandTertiary, fontWeight: "700", lineHeight: 21 },
  contactBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  contactText: { flex: 1, fontSize: typography.base, color: colors.onSurface, fontWeight: "600" },
});
