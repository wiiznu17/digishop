import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/contexts/AuthContext";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: "modal" }} />
          <Stack.Screen name="product/[id]" options={{ headerShown: true, title: "Product" }} />
          <Stack.Screen name="store/[id]" options={{ headerShown: true, title: "Store" }} />
          <Stack.Screen name="order/[id]" options={{ headerShown: true, title: "Order Detail" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
