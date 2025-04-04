import { useCallback, useEffect, useRef, useState } from "react";

export function useOnFullScreenChange(callback: VoidFunction) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    document.addEventListener("fullscreenchange", () => callbackRef.current());

    return () => {
      document.removeEventListener("fullscreenchange", () =>
        callbackRef.current()
      );
    };
  }, []);
}

export function useIsFullScreen() {
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useOnFullScreenChange(() =>
    setIsFullScreen(document.fullscreenElement !== null)
  );

  return isFullScreen;
}

export function useFullScreenToggle(
  targetElementRef: React.RefObject<HTMLElement>
) {
  const handleFullScreenToggle = useCallback(
    (event: KeyboardEvent) => {
      if (
        ["f", "F"].includes(event.key) &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.metaKey &&
        !(document.activeElement instanceof HTMLTextAreaElement) &&
        !(document.activeElement instanceof HTMLInputElement)
      ) {
        if (!targetElementRef.current) return;
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          targetElementRef.current.requestFullscreen();
        }
      }
    },
    [targetElementRef]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleFullScreenToggle);
    return () => {
      document.removeEventListener("keydown", handleFullScreenToggle);
    };
  }, [handleFullScreenToggle]);
}
