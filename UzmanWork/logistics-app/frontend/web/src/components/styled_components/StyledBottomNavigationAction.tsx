import { BottomNavigationAction, styled } from "@mui/material";

/* This is used to customize the appearance of BottomNavigation in a Grid layout or a container
 that does not directly use BottomNavigationAction as a child. */

export const StyledBottomNavigationAction = styled(BottomNavigationAction, {
  shouldForwardProp: (prop) => prop !== "isActive",
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
  p: 0,
  minHeight: "52px",
  "& .MuiBottomNavigationAction-label": {
    fontSize: theme.typography.body2,
  },
  "& .MuiSvgIcon-root, & .MuiBottomNavigationAction-label": {
    color: isActive
      ? theme.palette.secondary.main
      : theme.palette.text.secondary,
    opacity: 1,
  },
}));
