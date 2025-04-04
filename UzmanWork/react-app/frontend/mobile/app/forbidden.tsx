import { router } from "expo-router";
import { View, Button } from "react-native";
import { useAuth0 } from "react-native-auth0";

export default function ForbiddenView() {
  const { clearSession } = useAuth0();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button onPress={() => router.replace("/")} title="Go back Home" />
      <Button
        onPress={async () => {
          await clearSession();
          router.replace("/login");
        }}
        title="Logout"
      />
    </View>
  );
}
