import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import { Stack, Typography } from "@mui/material";
import { ForwardedRef, ReactNode, forwardRef } from "react";

interface SettingsMenuItemMobileProps {
  title: string;
  secondaryText?: string;
  onClick?: () => void;
  icon?: ReactNode;
}

export const SettingsMenuItemMobile = forwardRef(
  function SettingsMenuItemMobile(
    { title, secondaryText, onClick, icon }: SettingsMenuItemMobileProps,
    forwardedRef: ForwardedRef<HTMLDivElement>
  ) {
    return (
      <List
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #DFE0E6",
        }}
      >
        <ListItem onClick={onClick}>
          <Stack
            ref={forwardedRef}
            direction="row"
            width="100%"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body2">{title}</Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              {secondaryText && (
                <Typography variant="body2">{secondaryText}</Typography>
              )}
              {icon && icon}
            </Stack>
          </Stack>
        </ListItem>
      </List>
    );
  }
);
