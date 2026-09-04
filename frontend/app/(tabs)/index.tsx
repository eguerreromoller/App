import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api, Category, Workshop } from "@/src/api";
import { colors, radius, shadow, spacing, typography } from "@/src/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Workshop[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [cats, feat, all] = await Promise.all([
        api.categories(),
        api.featured(),
        api.workshops({ category: selectedCat || undefined, search: search || undefined }),
      ]);
      setCategories(cats);
      setFeatured(feat);
      setWorkshops(all);
    } catch {
      setError("No se pudo cargar. Toca para reintentar.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const all = await api.workshops({
          category: selectedCat || undefined,
          search: search || undefined,
        });
        setWorkshops(all);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [selectedCat, search]);

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    categories.forEach((c) => (m[c.key] = c.name));
    return m;
  }, [categories]);

  if (loading) {
    return (
      <View style={styles.centered} testID="home-loading">
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Pressable onPress={load} testID="home-retry">
          <Text style={{ color: colors.error, fontSize: typography.lg }}>{error}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="home-screen">
      {/* Sticky Header */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/vitrina-logo.png")}
          style={styles.logo}
          contentFit="contain"
          testID="brand-logo"
        />
        <Text style={styles.subtitle}>Encuentra el taller ideal para tu auto</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.onSurfaceSecondary} />
          <TextInput
            testID="search-input"
            placeholder="Buscar taller, servicio o comuna"
            placeholderTextColor={colors.onSurfaceSecondary}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")} testID="search-clear">
              <Ionicons name="close-circle" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>
          )}
        </View>

        {/* Category chip row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipRowScroll}
        >
          <Chip
            testID="chip-all"
            label="Todas"
            active={!selectedCat}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCat(null);
            }}
          />
          {categories.map((c) => (
            <Chip
              key={c.key}
              testID={`chip-${c.key}`}
              label={c.name}
              active={selectedCat === c.key}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedCat(selectedCat === c.key ? null : c.key);
              }}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={workshops}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.brandPrimary}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          !selectedCat && !search && featured.length > 0 ? (
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={styles.sectionTitle}>Destacados</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
              >
                {featured.map((w) => (
                  <FeaturedCard
                    key={w.id}
                    workshop={w}
                    categoryName={categoryMap[w.category] || w.category}
                    onPress={() => router.push(`/workshop/${w.id}` as any)}
                  />
                ))}
              </ScrollView>
              <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
                Todos los talleres
              </Text>
            </View>
          ) : (
            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>
              {workshops.length} taller{workshops.length !== 1 ? "es" : ""} encontrado{workshops.length !== 1 ? "s" : ""}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <WorkshopRow
            workshop={item}
            categoryName={categoryMap[item.category] || item.category}
            onPress={() => router.push(`/workshop/${item.id}` as any)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap} testID="empty-state">
            <Ionicons name="car-sport-outline" size={64} color={colors.onSurfaceSecondary} />
            <Text style={styles.emptyTitle}>No hay talleres</Text>
            <Text style={styles.emptyDesc}>Prueba con otros filtros o búsqueda.</Text>
            <Pressable
              onPress={() => {
                setSelectedCat(null);
                setSearch("");
              }}
              style={styles.emptyBtn}
              testID="clear-filters"
            >
              <Text style={styles.emptyBtnText}>Limpiar filtros</Text>
            </Pressable>
          </View>
        }
      />

      {/* Turbo AI floating button */}
      <Pressable
        style={styles.turboFab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/chat" as any);
        }}
        testID="turbo-fab"
      >
        <Image
          source={require("../../assets/images/turbo-avatar.png")}
          style={styles.turboAvatar}
          contentFit="cover"
        />
        <View style={styles.turboPulse} />
      </Pressable>
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
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={[
        styles.chip,
        active ? { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary } : null,
      ]}
    >
      <Text style={[styles.chipText, active ? { color: colors.onBrandPrimary } : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FeaturedCard({
  workshop,
  categoryName,
  onPress,
}: {
  workshop: Workshop;
  categoryName: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`featured-${workshop.id}`}
      onPress={onPress}
      style={styles.featuredCard}
    >
      <Image source={{ uri: workshop.image_url }} style={styles.featuredImg} contentFit="cover" />
      <LinearGradient
        colors={["transparent", "rgba(33,37,41,0.2)", "rgba(33,37,41,0.85)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featuredBadge}>
        <Ionicons name="star" size={12} color="#F59F00" />
        <Text style={styles.featuredBadgeText}>{workshop.rating.toFixed(1)}</Text>
      </View>
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredCat}>{categoryName}</Text>
        <Text style={styles.featuredName} numberOfLines={1}>
          {workshop.name}
        </Text>
        <View style={styles.featuredLoc}>
          <Ionicons name="location" size={12} color="#F8F9FA" />
          <Text style={styles.featuredLocText}>{workshop.comuna}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function WorkshopRow({
  workshop,
  categoryName,
  onPress,
}: {
  workshop: Workshop;
  categoryName: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`workshop-row-${workshop.id}`}
      onPress={onPress}
      style={styles.row}
    >
      <Image source={{ uri: workshop.image_url }} style={styles.rowImg} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName} numberOfLines={1}>
          {workshop.name}
        </Text>
        <Text style={styles.rowCat} numberOfLines={1}>
          {categoryName}
        </Text>
        <View style={styles.rowMeta}>
          <Ionicons name="location-outline" size={12} color={colors.onSurfaceSecondary} />
          <Text style={styles.rowMetaText}>{workshop.comuna}</Text>
          <View style={styles.dot} />
          <Ionicons name="star" size={12} color="#F59F00" />
          <Text style={styles.rowMetaText}>
            {workshop.rating.toFixed(1)} ({workshop.review_count})
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  brand: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  logo: { width: 180, height: 52, alignSelf: "flex-start", marginLeft: -2 },
  subtitle: { fontSize: typography.base, color: colors.onSurfaceSecondary, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.onSurface,
    fontSize: typography.lg,
    padding: 0,
  },
  chipRowScroll: { marginTop: spacing.md, marginHorizontal: -spacing.lg, height: 48 },
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

  sectionTitle: {
    fontSize: typography.xl,
    fontWeight: "700",
    color: colors.onSurface,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  featuredCard: {
    width: 280,
    height: 180,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
    ...shadow.card,
  },
  featuredImg: { width: "100%", height: "100%" },
  featuredBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featuredBadgeText: { color: colors.onSurface, fontSize: typography.sm, fontWeight: "700" },
  featuredBottom: { position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.md },
  featuredCat: { color: "#D3F9D8", fontSize: typography.sm, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  featuredName: { color: "#FFFFFF", fontSize: typography.xl, fontWeight: "800", marginTop: 2 },
  featuredLoc: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  featuredLocText: { color: "#F8F9FA", fontSize: typography.sm },

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
  rowCat: { fontSize: typography.sm, color: colors.brandPrimary, fontWeight: "600", marginTop: 2 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rowMetaText: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.onSurfaceSecondary, marginHorizontal: 4 },

  emptyWrap: { alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.sm },
  emptyTitle: { fontSize: typography.xl, fontWeight: "700", color: colors.onSurface, marginTop: spacing.md },
  emptyDesc: { fontSize: typography.base, color: colors.onSurfaceSecondary, textAlign: "center" },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  emptyBtnText: { color: colors.onBrandPrimary, fontWeight: "700", fontSize: typography.base },
  turboFab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.floating,
  },
  turboAvatar: { width: 60, height: 60, borderRadius: 30 },
  turboPulse: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
