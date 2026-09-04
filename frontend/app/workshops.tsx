import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Category, Workshop } from "@/src/api";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function WorkshopsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [items, setItems] = useState<Workshop[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.workshops({ category }),
      api.categories(),
    ])
      .then(([w, c]) => {
        setItems(w);
        setCats(c);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const categoryName = useMemo(
    () => cats.find((c) => c.key === category)?.name || "Talleres",
    [cats, category]
  );

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.comuna.toLowerCase().includes(q) ||
        w.services.join(" ").toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="workshops-list-screen">
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="back-btn"
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {categoryName}
          </Text>
          <Text style={styles.subtitle}>{filtered.length} taller{filtered.length !== 1 ? "es" : ""}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.onSurfaceSecondary} />
        <TextInput
          testID="search-input"
          placeholder="Buscar en esta categoría"
          placeholderTextColor={colors.onSurfaceSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              testID={`workshop-row-${item.id}`}
              style={styles.row}
              onPress={() => router.push(`/workshop/${item.id}` as any)}
            >
              <Image source={{ uri: item.image_url }} style={styles.rowImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.rowMeta}>
                  <Ionicons name="location-outline" size={12} color={colors.onSurfaceSecondary} />
                  <Text style={styles.rowMetaText}>{item.comuna}</Text>
                  <View style={styles.dot} />
                  <Ionicons name="star" size={12} color="#F59F00" />
                  <Text style={styles.rowMetaText}>
                    {item.rating.toFixed(1)} ({item.review_count})
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="car-sport-outline" size={48} color={colors.onSurfaceSecondary} />
              <Text style={styles.emptyText}>No hay talleres en esta categoría.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.sm },
  title: { fontSize: typography.xl, fontWeight: "800", color: colors.onSurface },
  subtitle: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: typography.lg, padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  rowImg: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  rowName: { fontSize: typography.lg, fontWeight: "700", color: colors.onSurface },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rowMetaText: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.onSurfaceSecondary, marginHorizontal: 4 },
  emptyWrap: { alignItems: "center", padding: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.onSurfaceSecondary, fontSize: typography.base },
});
