import { Button, ButtonText } from "@gluestack-ui/themed";
import { Link } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function NotFoundView() {
  return (
    <SafeAreaView>
      <Text>Page not found</Text>
      <Link href={"/"} asChild>
        <Button>
          <ButtonText>
            <Text>Go back Home</Text>
          </ButtonText>
        </Button>
      </Link>
    </SafeAreaView>
  );
}

export default NotFoundView;
