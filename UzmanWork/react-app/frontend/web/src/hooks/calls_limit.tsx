import { DateTime } from "luxon";
import { useEffect, useRef, useState } from "react";

// Throttle will call the function at most once every throttleMs milliseconds
// All calls to the function within the throttleMs window will be ignored
export function useThrottle(fn: () => void, throttleMs: number) {
  const lastTime = useRef<DateTime>(
    DateTime.now().minus({ milliseconds: throttleMs * 2 })
  );

  useEffect(() => {
    if (DateTime.now().diff(lastTime.current).as("milliseconds") < throttleMs) {
      return;
    }
    fn();
    lastTime.current = DateTime.now();
  }, [fn, throttleMs]);
}

// Debounce will call the function after frequencyMs milliseconds have passed
// since the last call to the function. It will cancel the previous call if
// another call is made before the frequencyMs window has passed.
export function useDebounce<T>(
  value: T,
  frequencyMs: number,
  cb?: VoidFunction
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  const callbackRef = useRef<VoidFunction | undefined>(cb);
  callbackRef.current = cb;

  useEffect(() => {
    const debounceVisiblePortionTimer = setTimeout(() => {
      setDebouncedValue(value);
      callbackRef.current?.();
    }, frequencyMs);
    return () => clearTimeout(debounceVisiblePortionTimer);
  }, [value, frequencyMs]);

  return debouncedValue;
}
