import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import { customHeaderState } from "utils/globals";

// Customizes the header of the page with a custom node.
export function useCustomHeader(nodeFn: () => React.ReactNode) {
  const setCustomHeader = useSetRecoilState(customHeaderState);

  useEffect(() => {
    setCustomHeader(nodeFn());
    return () => setCustomHeader(null);
  }, [nodeFn, setCustomHeader]);
}
