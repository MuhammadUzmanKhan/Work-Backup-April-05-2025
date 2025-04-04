import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import { MouseHoverState, renderNavItems } from "./sidebar-section";

import { useRecoilState } from "recoil";
import { useRef } from "react";

import { IntercomButton } from "../components/intercom/IntercomButton";
import usePageNavigation from "../hooks/usePageNavigation";
import { useOnUnmount } from "../hooks/lifetime";
import { isSidebarOpenState } from "../utils/globals";

export const MINI_SIDEBAR_WIDTH = "60px";
const SIDEBAR_WIDTH = "180px";
export const Sidebar = () => {
  const location = useLocation();
  // Reference to the timeout ID
  const hoverTimeout = useRef<number | null>(null);
  const navigationItems = usePageNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useRecoilState(isSidebarOpenState);

  function onMouseOver(val: MouseHoverState) {
    if (val === MouseHoverState.MOUSE_OVER) {
      // Clear the existing timeout if any
      if (hoverTimeout.current) {
        window.clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }

      // Set a new timeout
      hoverTimeout.current = window.setTimeout(() => {
        setIsSidebarOpen(true);
      }, 1000);
    }

    if (val === MouseHoverState.MOUSE_LEAVE) {
      setIsSidebarOpen(false);
      if (hoverTimeout.current) {
        window.clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
    }
  }

  const itemsRendered = renderNavItems({
    items: navigationItems,
    path: location.pathname,
    isSidebarOpen,
  });

  useOnUnmount(() => {
    // Clear the existing timeout if any on unmount
    if (hoverTimeout.current) {
      window.clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
  });

  const contents = (
    <>
      <Stack
        flexDirection={"row"}
        alignItems={"center"}
        sx={{
          py: 3.75,
          pl: 1,
          height: "43px",
        }}
      >
        <IconButton
          sx={{ width: "100%", justifyContent: "start", overflow: "hidden" }}
          href="/"
        >
          {isSidebarOpen ? (
            <>
              <img
                src="/static/coram_logo.png"
                alt="Coram Logo"
                style={{
                  width: "24px",
                  height: "24px",
                  marginRight: "10px",
                  borderRadius: "2px",
                }}
              />
              <Typography variant="h2" color="neutral.1000">
                Coram AI
              </Typography>
            </>
          ) : (
            <img
              src="/static/coram_logo.png"
              alt="Coram logo"
              style={{ width: "24px", height: "24px", borderRadius: "2px" }}
            />
          )}
        </IconButton>
      </Stack>
      <Stack
        sx={{ mt: "1.2rem" }}
        justifyContent="space-between"
        flexGrow={1}
        pb="10px"
      >
        {itemsRendered}
        <Box px="12px">
          <IntercomButton showText={isSidebarOpen} />
        </Box>
      </Stack>
    </>
  );

  return (
    <Drawer
      anchor="left"
      open
      PaperProps={{
        sx: {
          backgroundColor: "green",
          borderRightColor: "#DFE0E6",
          borderRightStyle: "solid",
          borderRightWidth: 1,
          boxShadow: "10px 0px 50px 0px rgba(60, 62, 73, 0.20)",
          borderRight: "0",
          color: "#FFFFFF",
          width: isSidebarOpen ? SIDEBAR_WIDTH : MINI_SIDEBAR_WIDTH,
          overflow: "visible",
          transition: "all 0.2s ease-in-out",
          whiteSpace: "nowrap",
        },
      }}
      variant="permanent"
      onMouseOver={() => onMouseOver(MouseHoverState.MOUSE_OVER)}
      onMouseLeave={() => onMouseOver(MouseHoverState.MOUSE_LEAVE)}
    >
      {contents}
    </Drawer>
  );
};
