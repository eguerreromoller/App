import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Switch,
} from "react-native";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";

import { api, Category } from "@/src/api";
import { createWorkshop, isLoggedIn, updateWorkshop, WorkshopPayload } from "@/src/admin";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function AdminForm() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;

  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [comuna, setComuna] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [emailc, setEmailc] = useState("");
  const [website, setWebsite] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [services, setServices] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [featured, setFeatured] = useState(false);
  const [rating, setRating] = useState("");
  const [reviewCount, setReviewCount] = useState("");

  const init = useCallback(async () => {
    const ok = await isLoggedIn();
    if (!ok) {
      router.replace("/admin/login" as any);
      return;
    }
    try {
      const c = await api.categories();
      setCats(c);
      if (id) {
        const w = await api.workshop(id);
        setName(w.name);
        setSelectedCats(w.categories?.length ? w.categories : [w.category]);
        setDescription(w.description);
        setAddress(w.address);
        setComuna(w.comuna);
        setPhone(w.phone);
        setWhatsapp(w.whatsapp || "");
        setEmailc(w.email || "");
        setWebsite(w.website || "");
        setImageUrl(w.image_url);
        setServices(w.services.join(", "));
        setHoursText(
          Object.entries(w.hours)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        );
        setFeatured(w.is_featured);
        setRating(w.rating != null ? String(w.rating) : "");
        setReviewCount(w.review_count != null ? String(w.review_count) : "");
      }
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    init();
  }, [init]);

  const toggleCat = (key: string) => {
    setSelectedCats((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const buildPayload = (): WorkshopPayload | null => {
    if (!name.trim() || selectedCats.length === 0 || !address.trim() || !comuna.trim() || !phone.trim() || !imageUrl.trim()) {
      setError("Completa los campos obligatorios (*) y elige al menos un rubro");
      return null;
    }
    const hours: Record<string, string> = {};
    hoursText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .forEach((line) => {
        const idx = line.indexOf(":");
        if (idx > 0) {
          hours[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      });

    let ratingNum: number | undefined;
    if (rating.trim()) {
      const r = parseFloat(rating.replace(",", "."));
      if (isNaN(r) || r < 0 || r > 5) {
        setError("La puntuación de Google debe ser un número entre 0 y 5");
        return null;
      }
      ratingNum = r;
    }
    let reviewNum: number | undefined;
    if (reviewCount.trim()) {
      const n = parseInt(reviewCount.replace(/[^\d]/g, ""), 10);
      if (!isNaN(n)) reviewNum = n;
    }

    return {
      name: name.trim(),
      category: selectedCats[0],
      categories: selectedCats,
      description: description.trim(),
      address: address.trim(),
      comuna: comuna.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || undefined,
      email: emailc.trim() || undefined,
      website: website.trim() || undefined,
      image_url: imageUrl.trim(),
      services: services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      hours,
      is_featured: featured,
      rating: ratingNum,
      review_count: reviewNum,
    };
  };

  const onSave = async () => {
    setError(null);
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      if (editing && id) {
        await updateWorkshop(id, payload);
      } else {
        await createWorkshop(payload);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e?.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="admin-form">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="form-back">
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>{editing ? "Editar taller" : "Nuevo taller"}</Text>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Nombre *" value={name} onChangeText={setName} testID="f-name" placeholder="Taller Mecánica Andes" />

        <Text style={styles.label}>Rubros * (puedes elegir varios)</Text>
        <Text style={styles.helpText}>
          El taller aparecerá en cada rubro seleccionado y Turbo podrá derivarlo por cualquiera de ellos.
        </Text>
        <View style={styles.catWrap}>
          {cats.map((c) => {
            const on = selectedCats.includes(c.key);
            return (
              <Pressable
                key={c.key}
                testID={`f-cat-${c.key}`}
                onPress={() => toggleCat(c.key)}
                style={[
                  styles.catChip,
                  on && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
                ]}
              >
                {on && <Ionicons name="checkmark" size={14} color={colors.onBrandPrimary} style={{ marginRight: 4 }} />}
                <Text style={[styles.catChipText, on && { color: colors.onBrandPrimary }]}>
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field label="Descripción" value={description} onChangeText={setDescription} testID="f-desc" multiline placeholder="Descripción del taller" />
        <Field label="Dirección *" value={address} onChangeText={setAddress} testID="f-address" placeholder="Av. Siempre Viva 123" />
        <Field label="Comuna *" value={comuna} onChangeText={setComuna} testID="f-comuna" placeholder="Providencia" />
        <Field label="Teléfono *" value={phone} onChangeText={setPhone} testID="f-phone" keyboardType="phone-pad" placeholder="+56223456789" />
        <Field label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} testID="f-whatsapp" keyboardType="phone-pad" placeholder="+56912345678" />
        <Field label="Correo" value={emailc} onChangeText={setEmailc} testID="f-email" keyboardType="email-address" placeholder="contacto@taller.cl" />
        <Field label="Sitio web" value={website} onChangeText={setWebsite} testID="f-website" placeholder="https://..." />
        <Field label="URL de imagen *" value={imageUrl} onChangeText={setImageUrl} testID="f-image" placeholder="https://...jpg" />
        <Field label="Servicios (separados por coma)" value={services} onChangeText={setServices} testID="f-services" placeholder="Frenos, Cambio de aceite" />

        <Text style={styles.sectionLabel}>Puntuación en Google</Text>
        <View style={styles.ratingRow}>
          <View style={{ flex: 1 }}>
            <Field
              label="Puntuación (0 a 5)"
              value={rating}
              onChangeText={setRating}
              testID="f-rating"
              keyboardType="decimal-pad"
              placeholder="4.7"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="N° de reseñas"
              value={reviewCount}
              onChangeText={setReviewCount}
              testID="f-reviews"
              keyboardType="number-pad"
              placeholder="15"
            />
          </View>
        </View>

        <Field
          label="Horarios (uno por línea, formato Día: hora)"
          value={hoursText}
          onChangeText={setHoursText}
          testID="f-hours"
          multiline
          placeholder={"Lunes-Viernes: 09:00 - 18:00\nSábado: 09:00 - 13:00"}
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Destacado</Text>
            <Text style={styles.switchHint}>Aparece en el carrusel de inicio</Text>
          </View>
          <Switch
            testID="f-featured"
            value={featured}
            onValueChange={setFeatured}
            trackColor={{ true: colors.brandPrimary, false: colors.borderStrong }}
          />
        </View>

        {!!error && (
          <Text style={styles.error} testID="form-error">
            {error}
          </Text>
        )}

        <Pressable style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={onSave} disabled={saving} testID="form-save">
          {saving ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <Text style={styles.saveText}>{editing ? "Guardar cambios" : "Crear taller"}</Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
  testID?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={[styles.input, multiline && { height: 90, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceSecondary}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"}
      />
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
  label: { fontSize: typography.sm, fontWeight: "700", color: colors.onSurfaceSecondary, marginBottom: spacing.xs },
  sectionLabel: {
    fontSize: typography.base,
    fontWeight: "800",
    color: colors.onSurface,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  ratingRow: { flexDirection: "row", gap: spacing.md },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: typography.lg,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catRow: { gap: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.md },
  catWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  helpText: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginBottom: spacing.sm, lineHeight: 18 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary,
    borderWidth: 1,
    borderColor: colors.brandSecondary,
  },
  catChipText: { color: colors.onBrandSecondary, fontWeight: "600", fontSize: typography.base },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  switchLabel: { fontSize: typography.lg, fontWeight: "700", color: colors.onSurface },
  switchHint: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  error: { color: colors.error, fontSize: typography.base, marginTop: spacing.sm },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: { color: colors.onBrandPrimary, fontSize: typography.lg, fontWeight: "800" },
});
