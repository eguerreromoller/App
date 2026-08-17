import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardAvoidingView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";

import { api, Workshop } from "@/src/api";
import { colors, radius, shadow, spacing, typography } from "@/src/theme";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  recommendations?: Workshop[];
};

const AVATAR = require("../assets/images/turbo-avatar.png");

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList<ChatMsg>>(null);
  const sessionId = useRef(`sess-${Date.now()}-${Math.floor(Math.random() * 1e6)}`).current;

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "¡Hola! Soy Turbo 🚗 Cuéntame qué necesita tu vehículo y en qué comuna estás, y te recomiendo el taller ideal.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    return () => clearTimeout(t);
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    try {
      const res = await api.chat(sessionId, text);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: res.reply,
          recommendations: res.recommendations,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: "Ups, tuve un problema para responder. Intenta de nuevo en un momento.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const quickReplies = ["Cambio de aceite", "Frenos", "Pintura", "Neumáticos"];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]} testID="chat-screen">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} testID="chat-back">
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Image source={AVATAR} style={styles.headerAvatar} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>Turbo</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerStatus}>Asistente Vitrina</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.lg }}
          renderItem={({ item }) => <Bubble msg={item} onOpen={(id) => router.push(`/workshop/${id}` as any)} />}
          ListFooterComponent={
            sending ? (
              <View style={styles.typingRow}>
                <Image source={AVATAR} style={styles.typingAvatar} contentFit="cover" />
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={colors.brandPrimary} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick replies */}
        {messages.length <= 1 && (
          <View style={styles.quickWrap}>
            {quickReplies.map((q) => (
              <Pressable
                key={q}
                style={styles.quickChip}
                onPress={() => setInput(q)}
                testID={`quick-${q}`}
              >
                <Text style={styles.quickText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <KeyboardStickyView>
          <View style={[styles.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md }]}>
            <TextInput
              testID="chat-input"
              style={styles.input}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={colors.onSurfaceSecondary}
              value={input}
              onChangeText={setInput}
              multiline
              onSubmitEditing={send}
            />
            <Pressable
              style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.5 }]}
              onPress={send}
              disabled={!input.trim() || sending}
              testID="chat-send"
            >
              <Ionicons name="arrow-up" size={22} color={colors.onBrandPrimary} />
            </Pressable>
          </View>
        </KeyboardStickyView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Bubble({ msg, onOpen }: { msg: ChatMsg; onOpen: (id: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
        {!isUser && <Image source={AVATAR} style={styles.msgAvatar} contentFit="cover" />}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text style={[styles.bubbleText, isUser && { color: colors.onBrandPrimary }]}>
            {msg.text}
          </Text>
        </View>
      </View>

      {!isUser && !!msg.recommendations && msg.recommendations.length > 0 && (
        <View style={styles.recWrap}>
          {msg.recommendations.map((w) => (
            <Pressable
              key={w.id}
              style={styles.recCard}
              onPress={() => onOpen(w.id)}
              testID={`rec-${w.id}`}
            >
              <Image source={{ uri: w.image_url }} style={styles.recImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.recName} numberOfLines={1}>
                  {w.name}
                </Text>
                <View style={styles.recMeta}>
                  <Ionicons name="location-outline" size={12} color={colors.onSurfaceSecondary} />
                  <Text style={styles.recMetaText}>{w.comuna}</Text>
                  <View style={styles.recDot} />
                  <Ionicons name="star" size={12} color="#F59F00" />
                  <Text style={styles.recMetaText}>{w.rating.toFixed(1)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.brandPrimary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surfaceSecondary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  iconBtn: { padding: spacing.xs },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSecondary },
  headerName: { fontSize: typography.lg, fontWeight: "800", color: colors.onSurface },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  headerStatus: { fontSize: typography.sm, color: colors.onSurfaceSecondary },

  bubbleRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, maxWidth: "100%" },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceSecondary },
  bubble: { maxWidth: "78%", paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.lg },
  botBubble: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sm, ...shadow.card },
  userBubble: { backgroundColor: colors.brandPrimary, borderTopRightRadius: radius.sm },
  bubbleText: { fontSize: typography.lg, color: colors.onSurface, lineHeight: 21 },

  recWrap: { marginTop: spacing.sm, marginLeft: 36, gap: spacing.sm },
  recCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brandTertiary,
  },
  recImg: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.surfaceSecondary },
  recName: { fontSize: typography.base, fontWeight: "700", color: colors.onSurface },
  recMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  recMetaText: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  recDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.onSurfaceSecondary, marginHorizontal: 3 },

  typingRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  typingAvatar: { width: 28, height: 28, borderRadius: 14 },
  typingBubble: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadow.card,
  },

  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSecondary,
    borderWidth: 1,
    borderColor: colors.brandTertiary,
  },
  quickText: { color: colors.onBrandSecondary, fontWeight: "600", fontSize: typography.base },

  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: typography.lg,
    color: colors.onSurface,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
});
