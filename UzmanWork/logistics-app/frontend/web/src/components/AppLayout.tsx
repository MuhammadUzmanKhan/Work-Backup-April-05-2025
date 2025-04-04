import {
  Box,
  Container,
  Stack,
  Typography,
  styled,
  useTheme,
} from "@mui/material";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { MINI_SIDEBAR_WIDTH } from "theme/consts";
import { DESKTOP_BREAKPOINT } from "utils/layout";
import { DesktopOnly } from "./layout/DesktopOnly";
import { MobileOnly } from "./layout/MobileOnly";
import { Navbar } from "./navbar/navbar";
import { BackButton } from "./navbar/utils/BackButton";
import { Sidebar } from "./sidebar/sidebar";
import { HeaderMobile } from "./settings/mobile/HeaderMobile";

const LayoutRoot = styled("div")(({ theme }) => ({
  display: "flex",
  maxWidth: "100%",
  [theme.breakpoints.up(DESKTOP_BREAKPOINT)]: {
    paddingTop: 64,
    paddingLeft: MINI_SIDEBAR_WIDTH,
  },
}));

// This covers the bottom notch so content doesn't go over it
function MobileNotchGuard() {
  const theme = useTheme();
  return (
    <Box
      bgcolor={"background.paper"}
      height="env(safe-area-inset-bottom)"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar - 1,
        bgcolor: "yellow",
      }}
    />
  );
}

// The main layout for the app.
export function AppLayout({
  children,
  noExtraPaddingX,
  noExtraPaddingY,
  notchGuard = false,
}: {
  children?: ReactNode;
  noExtraPaddingX?: boolean;
  noExtraPaddingY?: boolean;
  notchGuard?: boolean;
}) {
  const location = useLocation();
  const shouldRenderBack = location.pathname.split("/").length > 2;

  return (
    <LayoutRoot>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: noExtraPaddingY ? 0 : 8,
          height: "100%",
        }}
      >
        <MobileOnly>{shouldRenderBack && <BackButton />}</MobileOnly>
        <DesktopOnly>
          <Navbar />
          <Sidebar />
        </DesktopOnly>
        <Container
          maxWidth={"xl"}
          sx={{
            px: noExtraPaddingX ? "0 !important" : "auto",
          }}
        >
          {children}
          {notchGuard && <MobileNotchGuard />}
        </Container>
      </Box>
    </LayoutRoot>
  );
}

export interface SimpleAppLayoutProps {
  showLogo?: boolean;
  children?: ReactNode;
}

// A simple layout for pages that don't need side or nav bar.
export function SimpleAppLayout({
  showLogo = true,
  children,
}: SimpleAppLayoutProps) {
  const theme = useTheme();
  return (
    <Stack
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      maxWidth="100vw"
      gap="20px"
      sx={{
        backgroundColor: theme.palette.neutral?.[1000],
      }}
    >
      {showLogo && (
        <img
          height="45px"
          src="/static/coram_ai_logo_positive.svg"
          style={{ maxWidth: "100%" }}
        />
      )}

      <Box width="100%">{children}</Box>
    </Stack>
  );
}

export interface MobileInnerPageLayoutProps {
  title: string;
  children?: ReactNode;
}

// A mobile layout for pages with a back button, title and no bottom nav bar.
export function MobileInnerPageLayout({
  title,
  children,
}: MobileInnerPageLayoutProps) {
  return (
    <Box
      sx={{
        backgroundColor: "white",
        minHeight: "fill-available",
      }}
    >
      <HeaderMobile>
        <Box
          sx={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <Typography variant="h3">{title}</Typography>
        </Box>
      </HeaderMobile>
      {children}
    </Box>
  );
}
