import { Stack, Typography, styled } from "@mui/material";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from "@mui/icons-material";
import type { SxProps } from "@mui/system";
import { ForwardedRef, forwardRef } from "react";

const CustomStack = styled(Stack)(({ theme }) => ({
  minWidth: 100,
  color: theme.palette.neutral?.[700],
  height: "2rem",
  display: "flex",
  justifyContent: "space-between",
  borderRadius: "0.2rem",
  paddingX: "0.7rem",
}));

interface StyledDropdownMenuProps {
  disabled?: boolean;
  text: string;
  sx?: SxProps;
  isOpen: boolean;
  onClick?: () => void;
}

export const StyledDropdownMenu = forwardRef(function StyledDropdownMenu(
  { disabled = false, text, sx, isOpen, onClick }: StyledDropdownMenuProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  return (
    <CustomStack
      onClick={onClick}
      ref={forwardedRef}
      direction="row"
      alignItems="center"
      border={1}
      borderColor="#DFE0E6"
      p={2}
      sx={{ cursor: disabled ? "auto" : "pointer", ...sx }}
    >
      <Typography variant="body2">{text}</Typography>
      {!disabled && isOpen ? (
        <KeyboardArrowUpIcon />
      ) : (
        <KeyboardArrowDownIcon />
      )}
    </CustomStack>
  );
});
