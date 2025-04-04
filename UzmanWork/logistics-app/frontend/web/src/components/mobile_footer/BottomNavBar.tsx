import { cloneElement, useState } from "react";
import { BottomNavigation, Drawer, useTheme, Stack, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { MOBILE_BOTTOM_NAVBAR_ITEMS } from "utils/navigation";
import Grid from "@mui/material/Unstable_Grid2";
import { StyledBottomNavigationAction } from "components/styled_components/StyledBottomNavigationAction";
import {
  ITEMS_PER_ROW,
  LESS_ITEM,
  MORE_ITEM,
  chunkNavItemsIntoRows,
} from "./utils";
import { useElementSize } from "hooks/element_size";

export interface BottomNavItem {
  title: string;
  path: string | null;
  icon: JSX.Element;
}

interface MobileBottomNavigationProps {
  items: BottomNavItem[];
  oneRowOnly: boolean;
  onSelect: (path: string | null) => void;
}

function MobileBottomNavigation({
  items,
  oneRowOnly,
  onSelect,
}: MobileBottomNavigationProps) {
  const location = useLocation();
  const theme = useTheme();

  const chunkedRows = chunkNavItemsIntoRows(
    items,
    oneRowOnly ? MORE_ITEM : LESS_ITEM,
    ITEMS_PER_ROW
  ).slice(0, oneRowOnly ? 1 : undefined);

  return (
    <BottomNavigation
      component={Stack}
      sx={{
        height: "auto",
        justifyContent: "space-between",
        flexDirection: "column-reverse",
        px: 1,
      }}
      value={items.findIndex((item) => item.path === location.pathname)}
      showLabels
    >
      {chunkedRows.map((row, rowIndex) => (
        <Grid container key={rowIndex}>
          {row.map((item) => (
            <Grid key={item.title} xs={12 / ITEMS_PER_ROW}>
              <StyledBottomNavigationAction
                key={item.title}
                label={item.title}
                icon={cloneElement(item.icon, {
                  color:
                    item.path === location.pathname
                      ? theme.palette.secondary.main
                      : theme.palette.text.secondary,
                })}
                isActive={item.path === location.pathname}
                onClick={() => onSelect(item.path)}
                sx={{ minWidth: "100%", lineHeight: "15px", px: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      ))}
    </BottomNavigation>
  );
}

// This is a nav bar at the bottom of the screen which should be used on mobile devices
export function BottomNavBar() {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { size, setRef } = useElementSize();

  function handleNavigationClick(path: string | null) {
    if (path === null) return setDrawerOpen(!drawerOpen);
    navigate(path);
  }

  return (
    <>
      {/* This elements pushes up the content so the navigation doesn't cover it */}
      <Box sx={{ height: size.height }} />
      {/* This elements cover the bottom notch so content doesn't go over it */}
      <Box
        bgcolor={"background.paper"}
        height="env(safe-area-inset-bottom)"
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar - 1,
        }}
      />
      <Box
        ref={setRef}
        sx={{
          position: "fixed",
          bottom: "env(safe-area-inset-bottom)",
          left: 0,
          right: 0,
          borderTop: "1px solid #DFE0E6",
          px: 1,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <MobileBottomNavigation
          items={MOBILE_BOTTOM_NAVBAR_ITEMS}
          oneRowOnly={true}
          onSelect={handleNavigationClick}
        />
      </Box>
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box pb="env(safe-area-inset-bottom)">
          <MobileBottomNavigation
            items={MOBILE_BOTTOM_NAVBAR_ITEMS}
            oneRowOnly={false}
            onSelect={handleNavigationClick}
          />
        </Box>
      </Drawer>
    </>
  );
}
