import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";

import { adminLogin } from "@/src/admin";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function AdminLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError("Ingresa correo y contraseña.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await adminLogin(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/admin" as any);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(e?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="admin-login-screen">
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="login-back">
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoCircle}>
          <Ionicons name="lock-closed" size={32} color={colors.brandPrimary} />
        </View>
        <Text style={styles.title}>Administración</Text>
        <Text style={styles.subtitle}>Ingresa para gestionar los talleres</Text>

        <Text style={styles.label}>Correo</Text>
        <TextInput
          testID="login-email"
          style={styles.input}
          placeholder="contacto@vitrinaautomotriz.cl"
          placeholderTextColor={colors.onSurfaceSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />

        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passWrap}>
          <TextInput
            testID="login-password"
            style={styles.passInput}
            placeholder="••••••••"
            placeholderTextColor={colors.onSurfaceSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowPass((s) => !s)} testID="toggle-password">
            <Ionicons
              name={showPass ? "eye-off" : "eye"}
              size={20}
              color={colors.onSurfaceSecondary}
            />
          </Pressable>
        </View>

        {!!error && (
          <Text style={styles.error} testID="login-error">
            {error}
          </Text>
        )}

        <Pressable
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={loading}
          testID="login-submit"
        >
          {loading ? (
            <ActivityIndicator color={colors.onBrandPrimary} />
          ) : (
            <Text style={styles.submitText}>Iniciar sesión</Text>
          )}
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  topBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backBtn: { padding: spacing.sm, alignSelf: "flex-start" },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  title: { fontSize: typography.xxl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: typography.base, color: colors.onSurfaceSecondary, marginTop: 4, marginBottom: spacing.xl },
  label: { fontSize: typography.sm, fontWeight: "700", color: colors.onSurfaceSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: typography.lg,
    color: colors.onSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passInput: { flex: 1, paddingVertical: 14, fontSize: typography.lg, color: colors.onSurface },
  error: { color: colors.error, fontSize: typography.base, marginTop: spacing.md },
  submitBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.brandPrimary,
    borderRadius: radius.pill,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: { color: colors.onBrandPrimary, fontSize: typography.lg, fontWeight: "800" },
});
