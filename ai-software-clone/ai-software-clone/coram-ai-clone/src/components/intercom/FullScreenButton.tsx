import { Box, Tooltip } from "@mui/material";
import { ExpandIcon } from "../../icons/expand-icon";

interface FullScreenButtonProps {
  onClick: VoidFunction;
}

export function FullScreenButton({ onClick }: FullScreenButtonProps) {
  return (
    <Tooltip followCursor title={"Go to full screen"} placement="bottom-start">
      <Box
        onClick={onClick}
        sx={{
          borderRadius: "4px",
          border: "1px solid #ccc",
          cursor: "pointer",
          minHeight: "42px",
          minWidth: "41px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover": {
            transform: "scale(1.01)",
            border: "1px solid #3FC79A",
          },
        }}
      >
        <ExpandIcon />
      </Box>
    </Tooltip>
  );
}
