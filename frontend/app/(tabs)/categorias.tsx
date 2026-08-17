import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Category } from "@/src/api";
import { colors, radius, shadow, spacing, typography } from "@/src/theme";

export default function CategoriasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .categories()
      .then(setCats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="categorias-screen">
      <View style={styles.header}>
        <Text style={styles.title}>Categorías</Text>
        <Text style={styles.subtitle}>Explora servicios por especialidad</Text>
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {cats.map((c) => (
          <Pressable
            key={c.key}
            testID={`cat-tile-${c.key}`}
            style={styles.tile}
            onPress={() => router.push(`/workshops?category=${c.key}` as any)}
          >
            <Image source={{ uri: c.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient
              colors={["transparent", "rgba(33,37,41,0.35)", "rgba(33,37,41,0.85)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.tileName}>{c.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.base, color: colors.onSurfaceSecondary, marginTop: 2 },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tile: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    ...shadow.card,
  },
  tileName: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    color: "#FFFFFF",
    fontSize: typography.lg,
    fontWeight: "800",
  },
});
