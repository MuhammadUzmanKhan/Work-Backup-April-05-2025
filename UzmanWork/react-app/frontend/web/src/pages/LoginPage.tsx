import { useAuth0 } from "@auth0/auth0-react";
import { Browser } from "@capacitor/browser";
import { useOnMount } from "hooks/lifetime";

export function LoginPage() {
  const { loginWithRedirect } = useAuth0();
  // NOTE(@lberg): Immediately redirect to the login page on mount.
  useOnMount(async () => {
    await loginWithRedirect({
      authorizationParams: {
        prompt: "login",
      },
      appState: { returnTo: "/" },
      async openUrl(url: string) {
        await Browser.open({
          url,
          windowName: "_self",
        });
      },
    });
  });

  return <></>;
}
