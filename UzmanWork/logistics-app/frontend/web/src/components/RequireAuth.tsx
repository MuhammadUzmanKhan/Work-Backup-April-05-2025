import { useAuth0 } from "@auth0/auth0-react";
import { Navigate } from "react-router-dom";
import { useLogout } from "hooks/logout";
import { AbsolutelyCentered } from "./AbsolutelyCentered";
import { CircularProgress } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import { OpenAPI, isDefined } from "coram-common-utils";
import {
  useLogoutIfLoginStuck,
  useTrackLoginTimeInSentry,
} from "hooks/auth_control";
import * as Sentry from "@sentry/react";
import { errorShouldLogOut } from "utils/auth0_errors";

// Hook to track the OpenAPI token and update it.
// The value is not reactive, so we need to wrap it to make it as such.
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
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { logoutHandlerStable } = useLogout();
  const [token, setToken] = useOpenAPIToken();

  const {
    isAuthenticated,
    isLoading: isLoadingAuth,
    user,
    getAccessTokenSilently,
  } = useAuth0();
  const userRef = useRef(user);
  userRef.current = user;

  // set the token for the backend client to fetch from auth0
  // after we are authenticated.
  useEffect(() => {
    const tokenFn = async () =>
      await getAccessTokenSilently({ timeoutInSeconds: 5 });

    async function _setToken() {
      // before setting the token, try to get it from auth0.
      // If a reuse detection is triggered, logout the user.
      // NOTE(@lberg): this was left here as a precaution.
      // If the browser is forcefully closed while the token request is in progress
      // the reuse will trigger at the next page load. This code will logout the user.
      try {
        await tokenFn();
        setToken(tokenFn);
      } catch (e) {
        const tags = {
          loggingOut: errorShouldLogOut(e),
          email: `${userRef.current?.email}`,
        };
        if (tags.loggingOut) {
          Sentry.captureException(e, { tags });
          console.error(
            "Logging out because of auth0 error:" + JSON.stringify(e)
          );
          await logoutHandlerStable.current();
        }
      }
    }

    if (!isAuthenticated) {
      setToken(undefined);
      return;
    }
    _setToken();
  }, [isAuthenticated, getAccessTokenSilently, setToken, logoutHandlerStable]);

  // // TODO(@lberg): remove these once we solve the issue.
  useLogoutIfLoginStuck(isLoadingAuth);
  useTrackLoginTimeInSentry(isLoadingAuth);

  if (isLoadingAuth) {
    return (
      <AbsolutelyCentered>
        <CircularProgress />
      </AbsolutelyCentered>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // NOTE(@lberg): we expect this state to be transitory and go away
  // immediately after isAuthenticated.
  // Still, we must handle it or we will send requests
  // with an undefined token function.
  if (!isDefined(token)) {
    return (
      <AbsolutelyCentered>
        <CircularProgress />
      </AbsolutelyCentered>
    );
  }

  if (
    !isDefined(user) ||
    !isDefined(user["coram_organization_ids"]) ||
    user["coram_organization_ids"].length === 0
  ) {
    return <Navigate to="/403" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
