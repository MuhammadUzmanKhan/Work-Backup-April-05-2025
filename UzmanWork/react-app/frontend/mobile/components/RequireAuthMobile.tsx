import { useCallback, useEffect, useRef, useState } from "react";
import { OpenAPI } from "coram-common-utils/src/backend_client";
import { useAuth0 } from "react-native-auth0";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { Spinner } from "@gluestack-ui/themed";

// Hook to track the OpenAPI token and update it.
// The value is not reactive, so we need to wrap it to make it as such.
// TODO(@lberg): move to utils
function useOpenAPIToken() {
  const [tokenState, setTokenState] = useState<typeof OpenAPI.TOKEN>(undefined);

  const setTokens = useCallback(
    (token: typeof OpenAPI.TOKEN) => {
      // ensure the original value is updated before the state is updated
      OpenAPI.TOKEN = token;
      // only this will cause the component to re-render
      setTokenState(token);
    },
    [setTokenState]
  );

  return [tokenState, setTokens] as const;
}

// Component to require authentication.
// It will render nothing while loading, redirect to 403 if the user is not authenticated
export function RequireAuthMobile({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useOpenAPIToken();

  const {
    isLoading: isLoadingAuth,
    user,
    getCredentials,
    clearSession,
  } = useAuth0();
  const userRef = useRef(user);
  userRef.current = user;

  const getCredentialsRef = useRef(getCredentials);
  getCredentialsRef.current = getCredentials;

  const clearSessionRef = useRef(clearSession);
  clearSessionRef.current = clearSession;

  const isAuthenticated = user !== null;

  // set the token for the backend client to fetch from auth0
  // after we are authenticated.
  useEffect(() => {
    const tokenFn = async () => {
      const credentials = await getCredentialsRef.current();
      if (!credentials) {
        throw new Error("No credentials found");
      }
      return credentials.accessToken;
    };

    async function _setToken() {
      try {
        await tokenFn();
        setToken(tokenFn);
      } catch (e) {
        console.error("logging out because of: ", e);
        await clearSessionRef.current();
      }
    }

    if (!isAuthenticated) {
      setToken(undefined);
      return;
    }
    _setToken();
  }, [isAuthenticated, setToken]);

  if (isLoadingAuth) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner size="large" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  // NOTE(@lberg): we expect this state to be transitory and go away
  // immediately after isAuthenticated.
  // Still, we must handle it or we will send requests
  // with an undefined token function.
  if (!token) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner size="large" />
      </View>
    );
  }

  if (
    !user ||
    !user["coram_organization_ids"] ||
    user["coram_organization_ids"].length === 0
  ) {
    return <Redirect href="/forbidden" />;
  }

  return <>{children}</>;
}
