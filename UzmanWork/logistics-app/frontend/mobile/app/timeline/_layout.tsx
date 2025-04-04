import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[cameraId]" options={{ headerShown: false }} />
      <Stack.Screen name="details" />
    </Stack>
  );
}
