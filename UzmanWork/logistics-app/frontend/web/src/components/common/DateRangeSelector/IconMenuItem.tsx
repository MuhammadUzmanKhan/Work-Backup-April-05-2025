// This code is taken from https://www.npmjs.com/package/mui-nested-menu

import {
  Box,
  MenuItem,
  type MenuItemProps,
  styled,
  type SxProps,
  Typography,
} from "@mui/material";
import React, { forwardRef, RefObject } from "react";

const StyledMenuItem = styled(MenuItem)({
  display: "flex",
  justifyContent: "space-between",
  paddingLeft: "4px",
  paddingRight: "4px",
});

const StyledTypography = styled(Typography)({
  paddingLeft: "8px",
  paddingRight: "8px",
  textAlign: "left",
});

const FlexBox = styled(Box)({
  display: "flex",
});

type IconMenuItemProps = {
  MenuItemProps?: MenuItemProps;
  className?: string;
  disabled?: boolean;
  label?: string;
  renderLabel?: () => React.ReactNode;
  leftIcon?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  ref?: RefObject<HTMLLIElement>;
  rightIcon?: React.ReactNode;
  sx?: SxProps;
};

export const IconMenuItem = forwardRef<HTMLLIElement, IconMenuItemProps>(
  function IconMenuItem(
    {
      MenuItemProps,
      className,
      label,
      leftIcon,
      renderLabel,
      rightIcon,
      ...props
    },
    ref
  ) {
    return (
      <StyledMenuItem
        {...MenuItemProps}
        ref={ref}
        className={className}
        {...props}
      >
        <FlexBox>
          {leftIcon}
          {renderLabel ? (
            renderLabel()
          ) : (
            <StyledTypography>{label}</StyledTypography>
          )}
        </FlexBox>
        {rightIcon}
      </StyledMenuItem>
    );
  }
);
