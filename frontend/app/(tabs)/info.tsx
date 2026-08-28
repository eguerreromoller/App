import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isLoggedIn } from "@/src/admin";
import { colors, radius, spacing, typography } from "@/src/theme";

const WHATSAPP = "56932196215";
const PORTAL_URL = "https://vitrinaautomotriz.cl/";

export default function InfoScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openWhatsApp = () => Linking.openURL(`https://wa.me/${WHATSAPP}`);
  const openPortal = () => Linking.openURL(PORTAL_URL);
  const openFacebook = () =>
    Linking.openURL("https://www.facebook.com/profile.php?id=61555561365100");
  const openInstagram = () =>
    Linking.openURL("https://www.instagram.com/portalvitrinaautomotriz/");

  const openAdmin = async () => {
    const ok = await isLoggedIn();
    router.push((ok ? "/admin" : "/admin/login") as any);
  };

  const openPrivacidad = () => router.push("/legal?doc=privacidad" as any);
  const openTerminos = () => router.push("/legal?doc=terminos" as any);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      testID="info-screen"
    >
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/vitrina-logo.png")}
          style={styles.headerLogo}
          contentFit="contain"
          testID="info-logo"
        />
        <Text style={styles.subtitle}>Juntos en el cuidado de tu vehículo</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sobre nosotros</Text>
        <Text style={styles.cardBody}>
          Conectamos talleres y prestadores de servicios automotrices con clientes en todo Chile.
          Encuentra especialistas de confianza cerca de ti y accede a servicios de calidad.
        </Text>
      </View>

      <Text style={styles.section}>Contacto</Text>

      <Pressable style={styles.row} onPress={openWhatsApp} testID="row-whatsapp">
        <View style={[styles.iconBox, { backgroundColor: "#D3F9D8" }]}>
          <Ionicons name="logo-whatsapp" size={20} color={colors.brandPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>WhatsApp</Text>
          <Text style={styles.rowSub}>+56 9 3219 6215</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
      </Pressable>

      <Pressable style={styles.row} onPress={openPortal} testID="row-portal">
        <View style={[styles.iconBox, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="globe" size={20} color={colors.brandPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Portal Web</Text>
          <Text style={styles.rowSub}>vitrinaautomotriz.cl</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
      </Pressable>

      <Text style={styles.section}>Síguenos</Text>

      <Pressable style={styles.row} onPress={openFacebook} testID="row-facebook">
        <View style={[styles.iconBox, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="logo-facebook" size={20} color={colors.brandPrimary} />
        </View>
        <Text style={[styles.rowTitle, { flex: 1 }]}>Facebook</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
      </Pressable>

      <Pressable style={styles.row} onPress={openInstagram} testID="row-instagram">
        <View style={[styles.iconBox, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="logo-instagram" size={20} color={colors.brandPrimary} />
        </View>
        <Text style={[styles.rowTitle, { flex: 1 }]}>Instagram</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
      </Pressable>

      <Text style={styles.section}>Legal</Text>

      <Pressable style={styles.row} onPress={openPrivacidad} testID="row-privacidad">
        <View style={[styles.iconBox, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="shield-checkmark" size={20} color={colors.brandPrimary} />
        </View>
        <Text style={[styles.rowTitle, { flex: 1 }]}>Política de Privacidad</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
      </Pressable>

      <Pressable style={styles.row} onPress={openTerminos} testID="row-terminos">
        <View style={[styles.iconBox, { backgroundColor: colors.brandTertiary }]}>
          <Ionicons name="document-text" size={20} color={colors.brandPrimary} />
        </View>
        <Text style={[styles.rowTitle, { flex: 1 }]}>Términos de Uso</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
      </Pressable>

      <Text style={styles.section}>Gestión</Text>

      <Pressable style={styles.row} onPress={openAdmin} testID="row-admin">
        <View style={[styles.iconBox, { backgroundColor: colors.surfaceInverse }]}>
          <Ionicons name="lock-closed" size={18} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Administración</Text>
          <Text style={styles.rowSub}>Agregar y editar talleres</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceSecondary} />
      </Pressable>

      <Text style={styles.version}>Versión 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { alignItems: "center", padding: spacing.xl },
  headerLogo: { width: 220, height: 64, marginBottom: spacing.sm },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.base, color: colors.onSurfaceSecondary, marginTop: 4, textAlign: "center" },
  card: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
  },
  cardTitle: { fontSize: typography.lg, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.sm },
  cardBody: { fontSize: typography.base, color: colors.onSurfaceSecondary, lineHeight: 20 },
  section: {
    fontSize: typography.sm,
    fontWeight: "700",
    color: colors.onSurfaceSecondary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: typography.lg, fontWeight: "600", color: colors.onSurface },
  rowSub: { fontSize: typography.sm, color: colors.onSurfaceSecondary, marginTop: 2 },
  version: {
    textAlign: "center",
    color: colors.onSurfaceSecondary,
    fontSize: typography.sm,
    marginTop: spacing.xl,
  },
});
