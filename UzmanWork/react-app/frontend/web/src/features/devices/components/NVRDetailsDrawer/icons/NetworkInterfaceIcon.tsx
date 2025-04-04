import { SvgIcon, type SvgIconProps, useTheme } from "@mui/material";
import { forwardRef } from "react";

export const NetworkInterfaceIcon = forwardRef<
  SVGSVGElement,
  SvgIconProps & { active: boolean }
>(({ active, ...props }, ref) => {
  const theme = useTheme();

  return (
    <SvgIcon {...props} viewBox="0 0 64 64" fill="none" ref={ref}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M42 4H22V8H14V16H4V60H60V16H50V8H42V4Z"
        fill={active ? theme.palette.secondary.main : "#C3C9D4"}
      />
    </SvgIcon>
  );
});

NetworkInterfaceIcon.displayName = "NetworkInterfaceIcon";
