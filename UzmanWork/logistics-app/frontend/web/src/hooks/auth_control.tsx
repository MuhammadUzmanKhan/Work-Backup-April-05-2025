import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef } from "react";
import { useLogout } from "./logout";
import { DateTime, Duration } from "luxon";
import * as Sentry from "@sentry/react";

const MAX_LOGIN_TIME = Duration.fromObject({ seconds: 10 });

// TODO(@lberg): remove this once we debug the issue.
export function useLogoutIfLoginStuck(isLoading: boolean) {
  const { isAuthenticated, isLoading: isLoadingAuth, user } = useAuth0();
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;
  const isLoadingAuthRef = useRef(isLoadingAuth);
  isLoadingAuthRef.current = isLoadingAuth;
  const userRef = useRef(user);
  userRef.current = user;

  const { logoutHandlerStable } = useLogout();
  const startTimeRef = useRef<DateTime>(DateTime.now());

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    function onOverTime() {
      const tags = {
        isAuthenticated: `${isAuthenticatedRef.current}`,
        isLoadingAuth: `${isLoadingAuthRef.current}`,
        email: `${userRef.current?.email}`,
      };
      console.error(
        `Logging out user because of long loading time: ${JSON.stringify(tags)}`
      );
      const transaction = Sentry.startTransaction({
        name: "login-time-exceeded",
        tags: tags,
      });
      transaction.finish();
      logoutHandlerStable.current();
    }

    const interval = setInterval(() => {
      const loadingTimeS = DateTime.now().diff(startTimeRef.current);
      if (loadingTimeS > MAX_LOGIN_TIME) {
        onOverTime();
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [isLoading, logoutHandlerStable]);
}

// TODO(@lberg): remove this once we debug the issue.
export function useTrackLoginTimeInSentry(isLoading: boolean) {
  const { user } = useAuth0();
  const startTime = useRef(DateTime.now());
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const transaction = Sentry.startTransaction({
      name: "login-time",
      startTimestamp: startTime.current.toSeconds(),
      tags: { email: `${userRef.current?.email}` },
    });
    transaction.finish();
  }, [isLoading]);
}
