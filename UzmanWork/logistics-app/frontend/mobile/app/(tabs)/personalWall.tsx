import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function PersonalWallView() {
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Text>personalWall</Text>
    </SafeAreaView>
  );
}

export default PersonalWallView;
