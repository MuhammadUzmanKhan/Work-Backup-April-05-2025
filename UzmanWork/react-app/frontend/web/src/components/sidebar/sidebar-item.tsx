import styled from "@emotion/styled";
import type { ListItemProps } from "@mui/material";
import { Button, ListItem, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface SidebarItemProps extends ListItemProps {
  active?: boolean;
  chip?: ReactNode;
  icon?: ReactNode;
  info?: ReactNode;
  path?: string;
  title: string;
  isSidebarOpen?: boolean;
}

const SidebarButton = styled(Button)({
  justifyContent: "flex-start",
  backgroundColor: "common.white",
  borderRadius: "2.5rem",
  gap: "12px",
  color: "neutral.1000",
  minWidth: "36px",
  textAlign: "left",
  overflowX: "hidden",
  textTransform: "none",
  transition: "none",
  padding: "8px",
});

export function SidebarItem({
  active,
  chip,
  icon,
  info,
  path,
  title,
  isSidebarOpen,
}: SidebarItemProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const hoverBackgroundColor = active
    ? theme.palette.secondary.main
    : isSidebarOpen
    ? "rgba(240, 243, 251, 1)"
    : theme.palette.common.white;

  return (
    <ListItem
      disableGutters
      sx={{
        display: "flex",
        mb: 0.5,
        py: 0.2,
        px: 1.5,
        justifyContent: "flex-start",
      }}
    >
      <SidebarButton
        startIcon={icon}
        endIcon={chip}
        sx={{
          ...(active && {
            backgroundColor: "secondary.main",
            width: "100%",
          }),
          "& .MuiButton-startIcon": {
            margin: 0,
          },
          "&:hover": {
            minWidth: "100%",
            backgroundColor: hoverBackgroundColor,
            boxShadow: !isSidebarOpen
              ? "0px 0px 20px 0px rgba(60, 62, 73, 0.20)"
              : "none",
          },
        }}
        onClick={() => navigate(path as string)}
      >
        <Typography
          variant="body1"
          sx={{
            flexGrow: 1,
            color: active ? "common.white" : "neutral.1000",
          }}
        >
          {title}
        </Typography>
        {info}
      </SidebarButton>
    </ListItem>
  );
}
