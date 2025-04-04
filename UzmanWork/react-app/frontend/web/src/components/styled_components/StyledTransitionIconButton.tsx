import { IconButton, styled } from "@mui/material";

export const StyledTransitionIconButton = styled(IconButton)(() => ({
  transition: "transform 0.1s ease",
  "&:hover": {
    transform: "scale(1.02)",
  },
}));
