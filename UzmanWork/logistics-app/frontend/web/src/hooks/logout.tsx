import { useAuth0 } from "@auth0/auth0-react";
import { Browser } from "@capacitor/browser";
import { QUERY_CLIENT } from "utils/query_client";
import { useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";

export function useLogout() {
  const { logout } = useAuth0();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // NOTE(@lberg): On web, we can just redirect to the login page.
  // However, on mobile we open a new browser and we then have to
  // redirect to deep link so we can process and close the browser.
  // TODO(@lberg): using a different callback from the login one here
  // would be better, but it's not a priority.
  const returnTo = Capacitor.isNativePlatform()
    ? import.meta.env.VITE_AUTH0_CALLBACK_URL_NATIVE
    : window.location.origin + "/login";

  async function logoutHandler(onError?: (message: string) => void) {
    if (isLoggingOut) {
      console.warn("Already logging out");
      return;
    }
    try {
      setIsLoggingOut(true);
      await logout({
        logoutParams: {
          returnTo: returnTo,
        },
        async openUrl(url: string) {
          await Browser.open({
            url,
            windowName: "_self",
          });
        },
      });
      QUERY_CLIENT.removeQueries();
    } catch (err) {
      onError?.("Something went wrong. Please try again later!");
      console.error(err);
    } finally {
      setIsLoggingOut(false);
    }
  }
  // Return a stable ref which can be used in useEffect.
  const logoutHandlerStable = useRef(logoutHandler);
  logoutHandlerStable.current = logoutHandler;

  return { logoutHandler, isLoggingOut, logoutHandlerStable };
}
