import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

import { Workshop } from "@/src/api";
import { colors, radius, shadow, spacing, typography } from "@/src/theme";

const SANTIAGO: Region = {
  latitude: -33.45,
  longitude: -70.66,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

export default function WorkshopsMap({
  workshops,
  onOpen,
}: {
  workshops: Workshop[];
  onOpen: (id: string) => void;
}) {
  const mapRef = useRef<MapView>(null);
  const [selected, setSelected] = useState<Workshop | null>(null);

  const points = useMemo(
    () => workshops.filter((w) => typeof w.lat === "number" && typeof w.lng === "number"),
    [workshops]
  );

  useEffect(() => {
    setSelected(null);
    if (points.length === 0) return;
    const coords = points.map((w) => ({ latitude: w.lat as number, longitude: w.lng as number }));
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 120, right: 60, bottom: 180, left: 60 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [points]);

  return (
    <View style={styles.fill} testID="map-native">
      <MapView ref={mapRef} style={styles.fill} initialRegion={SANTIAGO}>
        {points.map((w) => (
          <Marker
            key={w.id}
            coordinate={{ latitude: w.lat as number, longitude: w.lng as number }}
            onPress={() => setSelected(w)}
            pinColor={colors.brandPrimary}
            testID={`marker-${w.id}`}
          />
        ))}
      </MapView>

      {selected && (
        <View style={styles.cardWrap}>
          <Pressable style={styles.card} onPress={() => onOpen(selected.id)} testID="map-card">
            <Image source={{ uri: selected.image_url }} style={styles.cardImg} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName} numberOfLines={1}>
                {selected.name}
              </Text>
              <View style={styles.cardMeta}>
                <Ionicons name="location" size={12} color={colors.brandPrimary} />
                <Text style={styles.cardMetaText}>{selected.comuna}</Text>
                <View style={styles.dot} />
                <Ionicons name="star" size={12} color="#F59F00" />
                <Text style={styles.cardMetaText}>{selected.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.cardCta}>Ver detalle →</Text>
            </View>
            <Pressable
              onPress={() => setSelected(null)}
              hitSlop={10}
              style={styles.closeBtn}
              testID="map-card-close"
            >
              <Ionicons name="close" size={18} color={colors.onSurfaceSecondary} />
            </Pressable>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cardWrap: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.lg },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.floating,
  },
  cardImg: { width: 60, height: 60, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary },
  cardName: { fontSize: typography.lg, fontWeight: "800", color: colors.onSurface },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  cardMetaText: { fontSize: typography.sm, color: colors.onSurfaceSecondary },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.onSurfaceSecondary, marginHorizontal: 3 },
  cardCta: { fontSize: typography.sm, color: colors.brandPrimary, fontWeight: "700", marginTop: 4 },
  closeBtn: { padding: spacing.xs },
});
