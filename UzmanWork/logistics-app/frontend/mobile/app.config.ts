import { ExpoConfig, ConfigContext } from "expo/config";

// NOTE(@lberg): see https://docs.expo.dev/workflow/configuration/
// this is a middleware executed after the static config is read
// we can use this to inject environment variables into the app
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Coram",
  slug: "Coram",
  plugins: [
    [
      "react-native-auth0",
      {
        domain: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID_NATIVE,
      },
    ],
    "expo-router",
  ],
});
