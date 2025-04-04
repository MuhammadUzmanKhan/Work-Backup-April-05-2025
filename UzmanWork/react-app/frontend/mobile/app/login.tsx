import {
  AddIcon,
  Button,
  ButtonIcon,
  ButtonText,
  VStack,
} from "@gluestack-ui/themed";
import { router } from "expo-router";
import { View } from "react-native";
import { useAuth0 } from "react-native-auth0";

export default function LoginView() {
  const { authorize } = useAuth0();

  async function onLogin(connection: string) {
    try {
      await authorize({
        scope: "openid profile email organization offline_access",
        audience: process.env.EXPO_PUBLIC_AUTH0_AUTH_WEB_AUDIENCE,
        connection: connection,
        additionalParameters: {
          prompt: "login",
        },
      });
      router.replace("/");
    } catch (e) {
      console.error(`error logging in: ${e}`);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <VStack space="md">
        <Button onPress={() => onLogin("google-oauth2")}>
          <ButtonIcon as={AddIcon} />
          <ButtonText>Log in with Google</ButtonText>
        </Button>

        <Button onPress={() => onLogin("apple")}>
          <ButtonIcon as={AddIcon} />
          <ButtonText>Log in with Apple</ButtonText>
        </Button>

        <Button onPress={() => onLogin("windowslive")}>
          <ButtonIcon as={AddIcon} />
          <ButtonText>Log in with Microsoft</ButtonText>
        </Button>

        <Button onPress={() => onLogin("Username-Password-Authentication")}>
          <ButtonIcon as={AddIcon} />
          <ButtonText>Log in with email</ButtonText>
        </Button>
      </VStack>
    </View>
  );
}
