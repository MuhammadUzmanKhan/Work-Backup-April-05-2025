import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { clipTimeSyncDataState } from "utils/globals";

export function ResetClipSyncTime({ children }: { children: React.ReactNode }) {
  // Global sync time shared across pages (reset on mount to force live
  // for timeline)
  const [, setClipSyncTimeState] = useRecoilState(clipTimeSyncDataState);

  useEffect(() => {
    setClipSyncTimeState(null);
  }, [setClipSyncTimeState]);

  return <>{children}</>;
}
