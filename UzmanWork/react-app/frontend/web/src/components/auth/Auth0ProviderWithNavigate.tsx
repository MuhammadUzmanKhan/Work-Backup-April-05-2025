import type { AppState } from "@auth0/auth0-react";
import { Auth0Provider } from "@auth0/auth0-react";
import { Capacitor } from "@capacitor/core";
import { Outlet, useNavigate } from "react-router-dom";

export function Auth0ProviderWithNavigate() {
  const navigate = useNavigate();

  const isNative = Capacitor.isNativePlatform();

  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = isNative
    ? import.meta.env.VITE_AUTH0_CLIENT_ID_NATIVE
    : import.meta.env.VITE_AUTH0_CLIENT_ID;
  const redirectUri = isNative
    ? import.meta.env.VITE_AUTH0_CALLBACK_URL_NATIVE
    : import.meta.env.VITE_AUTH0_CALLBACK_URL;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  const onRedirectCallback = (appState: AppState | undefined) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  if (!(domain && clientId && redirectUri && audience)) {
    console.error("Auth not set up correctly.");
    return null;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={true}
      useRefreshTokensFallback={!isNative}
      cacheLocation="localstorage"
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: "openid profile email organization offline_access",
      }}
    >
      <Outlet />
    </Auth0Provider>
  );
}
