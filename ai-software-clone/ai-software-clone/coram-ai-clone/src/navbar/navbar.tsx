import { Box, Toolbar, Typography } from "@mui/material";

import { useCallback } from "react";
import { useLocation } from "react-router-dom";

import { NavbarSurface } from "./NavbarSurface";

import { BackButton } from "../common/BackButton";
import usePageNavigation from "../hooks/usePageNavigation";
import { DESKTOP_BREAKPOINT } from "../utils/layout";
import { MINI_SIDEBAR_WIDTH } from "../sidebar/sidebar";
import { UserTopMenu } from "../components/intercom/UserTopMenu";

export const TOOLBAR_HEIGHT_PX = 64;

export const Navbar = () => {
  const { pathname } = useLocation();
  const navigationItems = usePageNavigation();
  const location = useLocation();
  const shouldRenderBack = location.pathname.split("/").length > 2;

  /**
   * This function checks if we need to show title(for main pages) or back button(for nested pages)
   * and return title or button component accordingly.
   */
  const getHeaderOrBackBtn = useCallback(() => {
    const item = navigationItems.find((item: { path: string }) =>
      pathname.includes(item.path)
    );
    if (item && pathname.includes(item.path)) {
      return (
        <Typography
          variant="h2"
          sx={{
            color: "#3C3E49",
            marginLeft: "1.2rem",
          }}
        >
          {item.title}
        </Typography>
      );
    } else if (shouldRenderBack) {
      return <BackButton />;
    }
  }, [navigationItems, pathname, shouldRenderBack]);

  function UserLinks() {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;

    return user ? (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.7rem",
        }}
      >
        <Typography color="common.black" variant="body2">
          {user.displayName}
        </Typography>
        <UserTopMenu />
      </Box>
    ) : (
      <></>
    );
  }

  return (
    <NavbarSurface
      sx={{
        left: {
          [DESKTOP_BREAKPOINT]: MINI_SIDEBAR_WIDTH,
        },
        width: {
          [DESKTOP_BREAKPOINT]: `calc(100% - ${MINI_SIDEBAR_WIDTH})`,
        },
      }}
    >
      <Toolbar
        disableGutters
        sx={{ left: 0, px: 2, backgroundColor: "common.white" }}
        style={{ height: TOOLBAR_HEIGHT_PX }}
      >
        <Box sx={{ flexGrow: 1 }}>{getHeaderOrBackBtn()}</Box>
        <UserLinks />
      </Toolbar>
    </NavbarSurface>
  );
};
