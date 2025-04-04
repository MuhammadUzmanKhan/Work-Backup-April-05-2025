import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import usePageNavigation from "hooks/usePageNavigation";
import { useLocation } from "react-router-dom";
import { MINI_SIDEBAR_WIDTH, SIDEBAR_WIDTH } from "theme/consts";
import { renderNavItems } from "./sidebar-section";
import { isSidebarOpenState } from "utils/globals";
import { useRecoilState } from "recoil";
import { IntercomButton } from "../intercom";

export const Sidebar = () => {
  const location = useLocation();
  // Reference to the timeout ID
  const navigationItems = usePageNavigation();
  const [isSidebarOpen, setIsSidebarOpen] = useRecoilState(isSidebarOpenState);

  const itemsRendered = renderNavItems({
    items: navigationItems,
    path: location.pathname,
    isSidebarOpen,
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
          backgroundColor: "common.white",
          borderRightColor: "#DFE0E6",
          borderRightStyle: "solid",
          borderRightWidth: 1,
          boxShadow: "10px 0px 50px 0px rgba(60, 62, 73, 0.20)",
          borderRight: "0",
          color: "#FFFFFF",
          width: isSidebarOpen ? SIDEBAR_WIDTH : MINI_SIDEBAR_WIDTH,
          transition: "all 0.2s ease-in-out",
          whiteSpace: "nowrap",
        },
      }}
      variant="permanent"
      onMouseOver={() => setIsSidebarOpen(true)}
      onMouseLeave={() => setIsSidebarOpen(false)}
    >
      {contents}
    </Drawer>
  );
};
