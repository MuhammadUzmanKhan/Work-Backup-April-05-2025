import { useCallback, useEffect, useRef, useState } from "react";

export function useHideArrows(enabled: boolean) {
  const [showArrows, setShowArrows] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowArrows(true);
    timeoutRef.current = setTimeout(() => setShowArrows(false), 1500);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    window.addEventListener("mousemove", resetHideTimer);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener("mousemove", resetHideTimer);
    };
  }, [enabled, resetHideTimer]);

  return { showArrows, resetHideTimer };
}

export function useKeyboardNavigation(
  enabled: boolean,
  handleNextVideoClick: VoidFunction,
  handlePreviousVideoClick: VoidFunction
) {
  const handleNextVideoClickRef = useRef(handleNextVideoClick);
  handleNextVideoClickRef.current = handleNextVideoClick;
  const handlePreviousVideoClickRef = useRef(handlePreviousVideoClick);
  handlePreviousVideoClickRef.current = handlePreviousVideoClick;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyNavigation(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        handleNextVideoClickRef.current();
      } else if (e.key === "ArrowRight") {
        handlePreviousVideoClickRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyNavigation);
    return () => window.removeEventListener("keydown", handleKeyNavigation);
  }, [enabled]);
}
