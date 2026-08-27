import { useCallback, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api, Workshop } from "@/src/api";
import { adminLogout, deleteWorkshop, isLoggedIn } from "@/src/admin";
import { colors, radius, shadow, spacing, typography } from "@/src/theme";

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const ok = await isLoggedIn();
    if (!ok) {
      router.replace("/admin/login" as any);
      return;
    }
    try {
      const all = await api.workshops({});
      setItems(all);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const onLogout = async () => {
    await adminLogout();
    router.replace("/(tabs)/info" as any);
  };

  const onDelete = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      await deleteWorkshop(id);
      setItems((prev) => prev.filter((w) => w.id !== id));
      setConfirmId(null);
    } catch {
      setConfirmId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.comuna.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="admin-dashboard">
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/(tabs)/info" as any)} style={styles.iconBtn} testID="admin-back">
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Panel de talleres</Text>
          <Text style={styles.subtitle}>
            {filtered.length} de {items.length} talleres
          </Text>
        </View>
        <Pressable onPress={onLogout} style={styles.iconBtn} testID="admin-logout">
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.onSurfaceSecondary} />
        <TextInput
          testID="admin-search"
          style={styles.searchInput}
          placeholder="Buscar por nombre o comuna para editar"
          placeholderTextColor={colors.onSurfaceSecondary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {!!search && (
          <Pressable onPress={() => setSearch("")} testID="admin-search-clear">
            <Ionicons name="close-circle" size={18} color={colors.onSurfaceSecondary} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.sm }}
          ListEmptyComponent={
            <View style={styles.emptyWrap} testID="admin-empty">
              <Ionicons name="search-outline" size={48} color={colors.onSurfaceSecondary} />
              <Text style={styles.emptyText}>No se encontraron talleres para “{search}”</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row} testID={`admin-row-${item.id}`}>
              <Image source={{ uri: item.image_url }} style={styles.rowImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {item.comuna} · {item.category}
                </Text>
                {item.is_featured && (
                  <View style={styles.featBadge}>
                    <Ionicons name="star" size={10} color="#F59F00" />
                    <Text style={styles.featText}>Destacado</Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => router.push(`/admin/form?id=${item.id}` as any)}
                style={styles.actionBtn}
                testID={`admin-edit-${item.id}`}
              >
                <Ionicons name="create-outline" size={20} color={colors.brandPrimary} />
              </Pressable>
              {confirmId === item.id ? (
                <View style={styles.confirmWrap}>
                  <Pressable onPress={() => onDelete(item.id)} style={styles.confirmYes} testID={`admin-delete-confirm-${item.id}`}>
                    <Text style={styles.confirmYesText}>Borrar</Text>
                  </Pressable>
                  <Pressable onPress={() => setConfirmId(null)} style={styles.actionBtn}>
                    <Ionicons name="close" size={20} color={colors.onSurfaceSecondary} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setConfirmId(item.id)}
                  style={styles.actionBtn}
                  testID={`admin-delete-${item.id}`}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => router.push("/admin/form" as any)}
        testID="admin-add"
      >
        <Ionicons name="add" size={26} color={colors.onBrandPrimary} />
        <Text style={styles.fabText}>Nuevo taller</Text>
      </Pressable>
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
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  iconBtn: { padding: spacing.sm },
  title: { fontSize: typography.xl, fontWeight: "800", color: colors.onSurface },
  subtitle: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: colors.onSurface, fontSize: typography.lg, padding: 0 },
  emptyWrap: { alignItems: "center", padding: spacing.xxl, gap: spacing.md },
  emptyText: { color: colors.onSurfaceSecondary, fontSize: typography.base, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  rowImg: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  rowName: { fontSize: typography.lg, fontWeight: "700", color: colors.onSurface },
  rowMeta: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  featBadge: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  featText: { fontSize: 10, color: colors.warning, fontWeight: "700" },
  actionBtn: { padding: spacing.sm },
  confirmWrap: { flexDirection: "row", alignItems: "center" },
  confirmYes: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  confirmYesText: { color: "#fff", fontWeight: "700", fontSize: typography.sm },
  fab: {
    position: "absolute",
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.pill,
    ...shadow.floating,
  },
  fabText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: typography.base },
});
