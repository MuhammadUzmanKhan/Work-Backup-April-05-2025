import { ReactNode } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { useIsMobile } from "./MobileOnly";
import { DESKTOP_BREAKPOINT } from "utils/layout";

export function useIsDesktop() {
  return !useIsMobile();
}

export enum ScreenSize {
  Small = "small",
  Medium = "medium",
  Large = "large",
  XLarge = "x-large",
  Unknown = "unknown",
}

export function useScreenSize() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(
    theme.breakpoints.between(DESKTOP_BREAKPOINT, "lg")
  );
  const isLargeScreen = useMediaQuery(theme.breakpoints.between("lg", "xl"));
  const isXLargeScreen = useMediaQuery(theme.breakpoints.up("xl"));
  if (isSmallScreen) {
    return ScreenSize.Small;
  } else if (isMediumScreen) {
    return ScreenSize.Medium;
  } else if (isLargeScreen) {
    return ScreenSize.Large;
  } else if (isXLargeScreen) {
    return ScreenSize.XLarge;
  } else ScreenSize.Unknown;
}
export function DesktopOnly({ children }: { children?: ReactNode }) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <>{children}</> : <></>;
}
