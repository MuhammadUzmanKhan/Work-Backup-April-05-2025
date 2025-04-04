import { useEffect, useRef } from "react";
import { useWakeLock } from "react-screen-wake-lock";
import { IosNoSleep } from "utils/ios_nosleep";

// Define some utils to check the released state.
function isReleased(released: boolean | undefined) {
  return released === true;
}
function isLocked(released: boolean | undefined) {
  return released === false;
}
function isUnknown(released: boolean | undefined) {
  return released === undefined;
}

// Check if the page is visible and the lock is released.
// If so, request the lock again.
const reacquireLockOnVisible = (
  released: boolean | undefined,
  request: () => void
) => {
  if (document.visibilityState !== "visible") {
    return;
  }
  // If the lock was released or never set, request it again.
  if (isReleased(released) || isUnknown(released)) {
    console.debug("Requesting wake lock");
    request();
  }
};

// Hook to force the screen to stay on.
export function useForceScreenOn() {
  const releasedRef = useRef<boolean | undefined>();
  const { isSupported, request, release, released } = useWakeLock();

  // Set a ref to the released state.
  // This avoids triggering the useEffect on released changes.
  useEffect(() => {
    releasedRef.current = released;
  }, [released]);

  // Acquire the wake lock on mount
  // and refresh the lock if the page is visible and the lock released.
  // This can happen if the user navigates away from the page and back in.
  // If wake lock is not supported, fallback to the hidden video trick (this is ios).
  useEffect(() => {
    let cleanupFn: undefined | (() => void) = undefined;
    if (isSupported) {
      const checkInterval = setInterval(
        () => reacquireLockOnVisible(releasedRef.current, request),
        1500
      );
      cleanupFn = () => {
        clearInterval(checkInterval);
        // Avoid warning from double locks.
        if (isLocked(releasedRef.current)) {
          release();
        }
      };
    } else {
      console.warn("Wake lock not supported, resorting to hidden video");
      const noSleep = new IosNoSleep();
      // NOTE(@lberg): this will only work if the user has interacted with the page.
      // There is no known workaround for this.
      const pointerFn = () => {
        noSleep.enable();
      };
      document.addEventListener("pointerdown", pointerFn, {
        once: true,
      });
      cleanupFn = () => {
        document.removeEventListener("pointerdown", pointerFn);
        noSleep.disable();
        noSleep.destroy();
      };
    }

    return () => {
      cleanupFn && cleanupFn();
    };
  }, [request, release, isSupported]);
}
