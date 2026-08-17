import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, Text as RNText, TextInput as RNTextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";

// Disable logbox errors so users see the app.
LogBox.ignoreAllLogs(true);

// Cap OS-level font scaling so large accessibility font settings don't
// blow up the layout / push content off-screen. Text still scales a bit
// (up to 1.2x) to respect accessibility without breaking the design.
const RNTextAny = RNText as unknown as { defaultProps?: Record<string, unknown> };
RNTextAny.defaultProps = RNTextAny.defaultProps || {};
RNTextAny.defaultProps.maxFontSizeMultiplier = 1.2;
const RNTextInputAny = RNTextInput as unknown as { defaultProps?: Record<string, unknown> };
RNTextInputAny.defaultProps = RNTextInputAny.defaultProps || {};
RNTextInputAny.defaultProps.maxFontSizeMultiplier = 1.2;

// Keep the native splash visible from cold start until icon fonts register.
// Required because @expo/vector-icons' componentDidMount fallback fires
// Font.loadAsync against a broken vendor path if any <Icon> mounts before
// the family is registered — which throws on Android Expo Go.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="workshop/[id]" options={{ presentation: "card", animation: "slide_from_right" }} />
            <Stack.Screen name="workshops" options={{ presentation: "card", animation: "slide_from_right" }} />
            <Stack.Screen name="admin/login" options={{ presentation: "card", animation: "slide_from_right" }} />
            <Stack.Screen name="admin/index" options={{ presentation: "card", animation: "slide_from_right" }} />
            <Stack.Screen name="admin/form" options={{ presentation: "card", animation: "slide_from_right" }} />
            <Stack.Screen name="chat" options={{ presentation: "card", animation: "slide_from_bottom" }} />
          </Stack>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
