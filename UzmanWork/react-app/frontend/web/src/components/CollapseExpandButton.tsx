import { Box } from "@mui/material";
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { DESKTOP_BREAKPOINT } from "utils/layout";

interface CollapseExpandButtonProps {
  miniSidebarOpen: boolean;
  buttonStyle?: React.CSSProperties;
  openedIconStyle?: React.CSSProperties;
  closedIconStyle?: React.CSSProperties;
  setMiniSidebarOpen: (miniSidebarOpen: boolean) => void;
}

const defaultIconStyles = {
  color: "common.black",
  backgroundColor: "common.white",
  border: "1.5px solid #DFE0E6",
  borderRadius: "2rem",
  cursor: "pointer",
  display: { xs: "none", [DESKTOP_BREAKPOINT]: "block" },
};
export function CollapseExpandButton({
  closedIconStyle,
  openedIconStyle,
  buttonStyle,
  miniSidebarOpen,
  setMiniSidebarOpen,
}: CollapseExpandButtonProps) {
  return (
    <Box
      sx={{
        ...buttonStyle,
      }}
    >
      {!miniSidebarOpen ? (
        <ChevronLeftIcon
          onClick={() => setMiniSidebarOpen(true)}
          sx={{
            ...defaultIconStyles,
            ...openedIconStyle,
          }}
        />
      ) : (
        <ChevronRightIcon
          onClick={() => setMiniSidebarOpen(false)}
          sx={{
            ...defaultIconStyles,
            ...closedIconStyle,
          }}
        />
      )}
    </Box>
  );
}
