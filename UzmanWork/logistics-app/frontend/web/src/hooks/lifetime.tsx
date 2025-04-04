import { useEffect, useRef } from "react";

// Run fn on mount
export function useOnMount(fn: (() => void) | (() => Promise<void>)) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  // NOTE(@lberg): this is needed only for strict mode in dev env
  // This way, both envs will behave the same
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    fnRef.current();
    initializedRef.current = true;
  }, []);
}

// Run fn on unmount
export function useOnUnmount(fn: (() => void) | (() => Promise<void>)) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  // NOTE(@lberg): this is needed only for strict mode in dev env
  // This way, both envs will behave the same

  useEffect(() => {
    return () => {
      fnRef.current();
    };
  }, []);
}
