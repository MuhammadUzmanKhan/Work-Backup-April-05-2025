import { createContext, useContext } from "react";
import { isDefined } from "coram-common-utils";

// Global context for the organization. Organization can be undefined.
export const WebRTCEnabledContext = createContext<boolean | undefined>(
  undefined
);

export function useWebRTCEnabledContext() {
  const isWebRTCEnabled = useContext(WebRTCEnabledContext);
  if (!isDefined(isWebRTCEnabled)) {
    throw new Error("WebRTC context is not defined upstream.");
  }
  return isWebRTCEnabled;
}
