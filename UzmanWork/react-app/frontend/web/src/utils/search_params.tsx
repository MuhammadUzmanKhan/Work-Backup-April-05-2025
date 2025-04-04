import { useCallback, useEffect, useRef } from "react";
import { useSearchParams as useSearchParamsOrig } from "react-router-dom";

// See https://github.com/remix-run/react-router/issues/9991
// The setter is not a stable reference, and it has a dep on the searchParams
export function useSearchParams() {
  const [searchParams, setSearchParams] = useSearchParamsOrig();
  // Store a reference to the setter
  const setSearchParamsRef = useRef(setSearchParams);
  // Update the reference when the setter changes
  useEffect(() => {
    setSearchParamsRef.current = setSearchParams;
  }, [setSearchParams]);
  // Return a stable setter (which has no dep on searchParams)
  const setSearchParamsStable = useCallback(
    (...args: Parameters<typeof setSearchParams>) =>
      setSearchParamsRef.current(...args),
    []
  );
  return { searchParams, setSearchParams: setSearchParamsStable };
}
