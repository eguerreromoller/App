import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";

import { importWorkshopsCsv, ImportResult, isLoggedIn } from "@/src/admin";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function AdminImport() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isLoggedIn().then((ok) => {
      if (!ok) router.replace("/admin/login" as any);
    });
  }, [router]);

  const pickFile = useCallback(async () => {
    setError(null);
    setDone(null);
    setPreview(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      const text = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      setFileName(asset.name);
      setCsvText(text);
      setLoading(true);
      const result = await importWorkshopsCsv(text, true);
      setPreview(result);
    } catch (e: any) {
      setError(e?.message || "No se pudo leer el archivo.");
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!csvText) return;
    setLoading(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await importWorkshopsCsv(csvText, false);
      setDone(result);
      setPreview(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e?.message || "No se pudo importar.");
    } finally {
      setLoading(false);
    }
  }, [csvText]);

  const reset = () => {
    setFileName(null);
    setCsvText(null);
    setPreview(null);
    setDone(null);
    setError(null);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="admin-import-screen">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="import-back">
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Importar CSV</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color={colors.brandPrimary} />
          <Text style={styles.infoText}>
            Sube un archivo .csv con columnas como Rubro, Comuna, Nombre, Dirección, Teléfono,
            WhatsApp, Puntuación Google y Número de Reseñas. Se omiten los talleres que ya existen
            (mismo nombre y comuna).
          </Text>
        </View>

        <Pressable style={styles.pickBtn} onPress={pickFile} testID="import-pick" disabled={loading}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.brandPrimary} />
          <Text style={styles.pickBtnText}>{fileName ? "Elegir otro archivo" : "Seleccionar archivo CSV"}</Text>
        </Pressable>

        {!!fileName && (
          <View style={styles.fileRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.onSurfaceSecondary} />
            <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brandPrimary} />
            <Text style={styles.loadingText}>Procesando…</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.errorBox} testID="import-error">
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Preview */}
        {preview && !loading && (
          <View testID="import-preview">
            <Text style={styles.sectionTitle}>Vista previa</Text>
            <View style={styles.statsRow}>
              <Stat value={preview.to_insert} label="Nuevos" color={colors.success} />
              <Stat value={preview.duplicates} label="Duplicados" color={colors.warning} />
              <Stat value={preview.unmapped} label="Sin rubro" color={colors.onSurfaceSecondary} />
            </View>

            {preview.sample.length > 0 && (
              <View style={styles.sampleBox}>
                <Text style={styles.sampleTitle}>Ejemplos a agregar:</Text>
                {preview.sample.map((s, i) => (
                  <View key={i} style={styles.sampleRow}>
                    <Ionicons name="add-circle" size={16} color={colors.success} />
                    <Text style={styles.sampleText} numberOfLines={1}>
                      {s.name} · {s.comuna} ({s.categories.join(", ")})
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {preview.to_insert > 0 ? (
              <Pressable style={styles.confirmBtn} onPress={confirmImport} testID="import-confirm">
                <Ionicons name="checkmark-circle" size={20} color={colors.onBrandPrimary} />
                <Text style={styles.confirmText}>Importar {preview.to_insert} talleres</Text>
              </Pressable>
            ) : (
              <Text style={styles.noneText}>No hay talleres nuevos para agregar en este archivo.</Text>
            )}
          </View>
        )}

        {/* Done */}
        {done && (
          <View testID="import-done">
            <View style={styles.doneBox}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
              <Text style={styles.doneTitle}>¡Listo!</Text>
              <Text style={styles.doneText}>
                Se agregaron {done.inserted} talleres nuevos.
                {done.duplicates > 0 ? ` ${done.duplicates} ya existían.` : ""}
                {done.unmapped > 0 ? ` ${done.unmapped} sin rubro válido.` : ""}
              </Text>
            </View>
            <Pressable style={styles.confirmBtn} onPress={() => router.replace("/admin" as any)} testID="import-goto-panel">
              <Text style={styles.confirmText}>Ver panel de talleres</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={reset} testID="import-again">
              <Text style={styles.secondaryText}>Importar otro archivo</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
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
  iconBtn: { padding: spacing.sm },
  title: { fontSize: typography.xl, fontWeight: "800", color: colors.onSurface },
  infoBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.brandSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: { flex: 1, fontSize: typography.sm, color: colors.onBrandSecondary, lineHeight: 19 },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
  },
  pickBtnText: { color: colors.brandPrimary, fontWeight: "700", fontSize: typography.lg },
  fileRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  fileName: { flex: 1, color: colors.onSurface, fontSize: typography.base, fontWeight: "600" },
  centered: { alignItems: "center", padding: spacing.xl, gap: spacing.sm },
  loadingText: { color: colors.onSurfaceSecondary, fontSize: typography.base },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FDECEC",
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorText: { flex: 1, color: colors.error, fontSize: typography.base },
  sectionTitle: { fontSize: typography.lg, fontWeight: "800", color: colors.onSurface, marginTop: spacing.xl, marginBottom: spacing.md },
  statsRow: { flexDirection: "row", gap: spacing.md },
  stat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
  },
  statValue: { fontSize: typography.xxl, fontWeight: "800" },
  statLabel: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  sampleBox: { marginTop: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, padding: spacing.md },
  sampleTitle: { fontSize: typography.sm, fontWeight: "700", color: colors.onSurfaceSecondary, marginBottom: spacing.sm },
  sampleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  sampleText: { flex: 1, color: colors.onSurface, fontSize: typography.sm },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: 16,
    marginTop: spacing.xl,
  },
  confirmText: { color: colors.onBrandPrimary, fontWeight: "800", fontSize: typography.lg },
  noneText: { color: colors.onSurfaceSecondary, fontSize: typography.base, textAlign: "center", marginTop: spacing.lg },
  doneBox: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  doneTitle: { fontSize: typography.xl, fontWeight: "800", color: colors.onSurface },
  doneText: { fontSize: typography.base, color: colors.onSurfaceSecondary, textAlign: "center", lineHeight: 22 },
  secondaryBtn: { alignItems: "center", paddingVertical: spacing.md, marginTop: spacing.sm },
  secondaryText: { color: colors.brandPrimary, fontWeight: "700", fontSize: typography.base },
});
