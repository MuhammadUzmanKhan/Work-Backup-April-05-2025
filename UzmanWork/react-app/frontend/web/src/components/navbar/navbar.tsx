import { useAuth0 } from "@auth0/auth0-react";
import { Box, Toolbar, Typography } from "@mui/material";
import { UserTopMenu } from "components/UserTopMenu";
import usePageNavigation from "hooks/usePageNavigation";
import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { MINI_SIDEBAR_WIDTH } from "theme/consts";
import { DESKTOP_BREAKPOINT } from "utils/layout";
import { NavbarSurface } from "./NavbarSurface";
import { BackButton } from "./utils/BackButton";
import { customHeaderState } from "utils/globals";
import { useRecoilValue } from "recoil";

export const TOOLBAR_HEIGHT_PX = 64;

export const Navbar = () => {
  const { pathname } = useLocation();
  const navigationItems = usePageNavigation();
  const customHeader = useRecoilValue(customHeaderState);
  const location = useLocation();
  const shouldRenderBack = location.pathname.split("/").length > 2;

  /**
   * This function checks if we need to show title(for main pages) or back button(for nested pages)
   * and return title or button component accordingly.
   */
  const getHeaderOrBackBtn = useCallback(() => {
    const item = navigationItems.find((item) => pathname.includes(item.path));

    // Custom header is independent of any check
    if (customHeader) {
      return customHeader;
    } else if (item && pathname.includes(item.path)) {
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
  }, [customHeader, navigationItems, pathname, shouldRenderBack]);

  function UserLinks() {
    const { user } = useAuth0();

    return user ? (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.7rem",
        }}
      >
        <img
          src="/static/user.png"
          height="35px"
          style={{ borderRadius: "5rem" }}
        />
        <Typography color="neutral.1000" variant="body2">
          {user.name ? user.name : user.email}
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
          [DESKTOP_BREAKPOINT]: `calc(100% - ${MINI_SIDEBAR_WIDTH}px)`,
        },
      }}
    >
      <Toolbar
        disableGutters
        sx={{ left: 0, px: 2 }}
        style={{ height: TOOLBAR_HEIGHT_PX }}
      >
        <Box sx={{ flexGrow: 1 }}>{getHeaderOrBackBtn()}</Box>
        <UserLinks />
      </Toolbar>
    </NavbarSurface>
  );
};
