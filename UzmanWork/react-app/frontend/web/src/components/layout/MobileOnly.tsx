import { Capacitor } from "@capacitor/core";
import type { Theme } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { ReactNode } from "react";
import { DESKTOP_BREAKPOINT } from "utils/layout";

export function isNative() {
  return Capacitor.isNativePlatform();
}

export function NativeOnly({ children }: { children?: ReactNode }) {
  return isNative() ? <>{children}</> : <></>;
}

export function useIsMobile() {
  const smallViewport = useMediaQuery((theme: Theme) =>
    theme.breakpoints.between("xs", DESKTOP_BREAKPOINT)
  );
  return isNative() || smallViewport;
}

export function MobileOnly({ children }: { children?: ReactNode }) {
  const isMobile = useIsMobile();
  return isMobile ? <>{children}</> : <></>;
}
