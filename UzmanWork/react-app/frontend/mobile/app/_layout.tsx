import { config } from "@gluestack-ui/config";
import { GluestackUIProvider } from "@gluestack-ui/themed";
import { Stack } from "expo-router";
import { Auth0Provider } from "react-native-auth0";
import { QueryClient, QueryClientProvider } from "react-query";
import { RecoilRoot } from "recoil";
import { OpenAPI } from "coram-common-utils/src/backend_client";
import { isDefined } from "coram-common-utils";

const QUERY_CLIENT = new QueryClient();

OpenAPI.BASE = `${process.env.EXPO_PUBLIC_DOMAIN}:${process.env.EXPO_PUBLIC_BACKEND_EXPOSED_PORT}`;

// NOTE(@lberg): this is always mounted at the root of the app
export default function HomeLayout() {
  const domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID_NATIVE;
  if (!isDefined(domain) || !isDefined(clientId)) {
    throw new Error("Auth0 domain or client id not defined");
  }

  return (
    <RecoilRoot>
      <QueryClientProvider client={QUERY_CLIENT}>
        <GluestackUIProvider config={config}>
          <Auth0Provider domain={domain} clientId={clientId}>
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, title: "Back" }}
              />
              <Stack.Screen name="timeline" options={{ headerShown: true }} />
            </Stack>
          </Auth0Provider>
        </GluestackUIProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}
