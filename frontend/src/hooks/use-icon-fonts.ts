// Icon font loader. @react-native-vector-icons/ionicons registers the
// "Ionicons" font family; we preload its bundled .ttf via expo-font so the
// first paint already has glyphs (no flash) on Expo Go, dev/prod builds and
// web. The library also lazy-loads the same family, so this is idempotent.
// Usage: const [loaded, error] = useIconFonts();

import { useFonts } from "expo-font";

export const useIconFonts = (): readonly [boolean, Error | null] =>
  useFonts({
    Ionicons: require("@react-native-vector-icons/ionicons/fonts/Ionicons.ttf"),
  });
