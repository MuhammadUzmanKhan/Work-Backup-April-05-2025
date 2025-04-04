import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function useSyncedState<T>(
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    setState(initialValue);
  }, [initialValue]);

  return [state, setState];
}
