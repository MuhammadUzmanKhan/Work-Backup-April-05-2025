import { Capacitor } from "@capacitor/core";

export function isIOS() {
  const userAgent = window.navigator.userAgent;
  const platform = Capacitor.getPlatform();
  return (
    platform === "ios" ||
    (platform === "web" && /iPad|iPhone|iPod/.test(userAgent))
  );
}
