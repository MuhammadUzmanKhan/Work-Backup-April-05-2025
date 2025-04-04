import { useForceScreenOn } from "hooks/force_screen_on";

// Component to force the screen to stay on.
// The hook is integrated here so we can conditionally render/use it.
export function NoSleep() {
  // Force the screen to stay on for the whole app.
  useForceScreenOn();
  return <></>;
}
