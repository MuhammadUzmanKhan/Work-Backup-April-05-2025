import { IconButton, styled } from "@mui/material";

export const StyledTimelineBarButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected: boolean }>(({ theme, isSelected }) => ({
  padding: "0.4rem",
  borderRadius: "4rem",
  color: isSelected
    ? theme.palette.common.white
    : String(theme.palette.neutral?.[600]),
  backgroundColor: isSelected ? theme.palette.secondary.main : "#F0F3FB",
  "&:hover": {
    backgroundColor: isSelected ? theme.palette.secondary.main : "#F0F3FB",
  },
}));
