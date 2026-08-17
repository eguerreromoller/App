import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api, Workshop } from "@/src/api";
import WorkshopsMap from "@/src/components/WorkshopsMap";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function MapaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [comunas, setComunas] = useState<string[]>([]);
  const [selectedComuna, setSelectedComuna] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.workshops({}), api.comunas()])
      .then(([w, c]) => {
        setWorkshops(w);
        setComunas(c);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (selectedComuna ? workshops.filter((w) => w.comuna === selectedComuna) : workshops),
    [workshops, selectedComuna]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="mapa-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Mapa de talleres</Text>
        <Text style={styles.subtitle}>
          {filtered.length} taller{filtered.length !== 1 ? "es" : ""}
          {selectedComuna ? ` en ${selectedComuna}` : ""}
        </Text>
      </View>

      <View style={styles.chipRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <Chip
            testID="comuna-all"
            label="Todas"
            active={!selectedComuna}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedComuna(null);
            }}
          />
          {comunas.map((c) => (
            <Chip
              key={c}
              testID={`comuna-${c}`}
              label={c}
              active={selectedComuna === c}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedComuna(selectedComuna === c ? null : c);
              }}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brandPrimary} />
          </View>
        ) : (
          <WorkshopsMap workshops={filtered} onOpen={(id) => router.push(`/workshop/${id}` as any)} />
        )}
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8 }}
      style={[styles.chip, active ? { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary } : null]}
    >
      <Text style={[styles.chipText, active ? { color: colors.onBrandPrimary } : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  title: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.base, color: colors.onSurfaceSecondary, marginTop: 2 },
  chipRowWrap: { height: 56, justifyContent: "center", borderBottomWidth: 0.5, borderBottomColor: colors.border },
  chipRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, alignItems: "center" },
  chip: {
    flexShrink: 0,
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary,
    borderWidth: 1,
    borderColor: colors.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { color: colors.onBrandSecondary, fontSize: typography.base, fontWeight: "600" },
  mapWrap: { flex: 1 },
});
