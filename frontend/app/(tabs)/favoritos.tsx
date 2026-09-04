import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api, Workshop } from "@/src/api";
import { getFavorites, toggleFavorite } from "@/src/favorites";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function FavoritosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const favIds = await getFavorites();
    if (favIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const all = await api.workshops({});
      setItems(all.filter((w) => favIds.includes(w.id)));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRemove = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleFavorite(id);
    setItems((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="favoritos-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Favoritos</Text>
        <Text style={styles.subtitle}>Tus talleres guardados</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap} testID="favoritos-empty">
          <Ionicons name="heart-outline" size={64} color={colors.onSurfaceSecondary} />
          <Text style={styles.emptyTitle}>Aún no tienes favoritos</Text>
          <Text style={styles.emptyDesc}>Agrega talleres desde su detalle para verlos aquí.</Text>
          <Pressable
            style={styles.exploreBtn}
            onPress={() => router.push("/(tabs)" as any)}
            testID="explore-btn"
          >
            <Text style={styles.exploreBtnText}>Explorar talleres</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable
                style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md }}
                onPress={() => router.push(`/workshop/${item.id}` as any)}
                testID={`fav-row-${item.id}`}
              >
                <Image source={{ uri: item.image_url }} style={styles.rowImg} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.rowMeta}>{item.comuna}</Text>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={12} color="#F59F00" />
                    <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                  </View>
                </View>
              </Pressable>
              <Pressable
                onPress={() => onRemove(item.id)}
                style={styles.removeBtn}
                testID={`fav-remove-${item.id}`}
              >
                <Ionicons name="heart" size={22} color={colors.error} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.base, color: colors.onSurfaceSecondary, marginTop: 2 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: typography.xl, fontWeight: "700", color: colors.onSurface, marginTop: spacing.md },
  emptyDesc: { fontSize: typography.base, color: colors.onSurfaceSecondary, textAlign: "center" },
  exploreBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  exploreBtnText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: typography.base },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  rowImg: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  rowName: { fontSize: typography.lg, fontWeight: "700", color: colors.onSurface },
  rowMeta: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: typography.sm, color: colors.onSurfaceSecondary, fontWeight: "600" },
  removeBtn: { padding: spacing.sm, marginLeft: spacing.sm },
});
