import { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Image } from "expo-image";
import Ionicons from "@react-native-vector-icons/ionicons";

import { Workshop } from "@/src/api";
import { colors, radius, spacing, typography } from "@/src/theme";

// Web fallback: react-native-maps is native-only, so on web we show
// the workshops grouped by comuna (still "ubicar por comuna").
export default function WorkshopsMap({
  workshops,
  onOpen,
}: {
  workshops: Workshop[];
  onOpen: (id: string) => void;
}) {
  const grouped = useMemo(() => {
    const m: Record<string, Workshop[]> = {};
    workshops.forEach((w) => {
      (m[w.comuna] = m[w.comuna] || []).push(w);
    });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [workshops]);

  return (
    <ScrollView style={styles.fill} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }} testID="map-web">
      <View style={styles.banner}>
        <Ionicons name="map" size={18} color={colors.brandPrimary} />
        <Text style={styles.bannerText}>
          El mapa interactivo se ve en la app móvil (Expo Go). Aquí los talleres por comuna.
        </Text>
      </View>
      {grouped.map(([comuna, list]) => (
        <View key={comuna} style={{ marginBottom: spacing.lg }}>
          <View style={styles.comunaRow}>
            <Ionicons name="location" size={16} color={colors.brandPrimary} />
            <Text style={styles.comunaTitle}>{comuna}</Text>
            <Text style={styles.comunaCount}>({list.length})</Text>
          </View>
          {list.map((w) => (
            <Pressable key={w.id} style={styles.row} onPress={() => onOpen(w.id)} testID={`map-row-${w.id}`}>
              <Image source={{ uri: w.image_url }} style={styles.rowImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {w.name}
                </Text>
                <Text style={styles.rowAddr} numberOfLines={1}>
                  {w.address}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.surface },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  bannerText: { flex: 1, fontSize: typography.sm, color: colors.onBrandSecondary },
  comunaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  comunaTitle: { fontSize: typography.lg, fontWeight: "800", color: colors.onSurface },
  comunaCount: { fontSize: typography.base, color: colors.onSurfaceSecondary },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  rowImg: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  rowName: { fontSize: typography.base, fontWeight: "700", color: colors.onSurface },
  rowAddr: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
});
