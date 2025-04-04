import { SvgIcon, type SvgIconProps, useTheme } from "@mui/material";
import { forwardRef } from "react";

export const RightDirectionIcon = forwardRef<
  SVGSVGElement,
  SvgIconProps & { selected: boolean }
>(({ selected, ...props }, ref) => {
  const theme = useTheme();

  const fillColor = selected
    ? theme.palette.primary.light
    : theme.palette.divider;

  const pathColor = selected
    ? theme.palette.common.white
    : theme.palette.text.primary;

  return (
    <SvgIcon {...props} viewBox="0 0 24 24" fill="none" ref={ref}>
      <circle cx="12" cy="12" r="12" fill={fillColor} />
      <path
        d="M6.22361 8.55279C5.97662 8.42929 5.67628 8.5294 5.55279 8.77639C5.42929 9.02338 5.5294 9.32372 5.77639 9.44721L6.22361 8.55279ZM18.1581 15.4743C18.4201 15.387 18.5617 15.1039 18.4743 14.8419L17.0513 10.5728C16.964 10.3108 16.6808 10.1693 16.4189 10.2566C16.1569 10.3439 16.0153 10.6271 16.1026 10.889L17.3675 14.6838L13.5728 15.9487C13.3108 16.036 13.1693 16.3192 13.2566 16.5811C13.3439 16.8431 13.6271 16.9847 13.889 16.8974L18.1581 15.4743ZM5.77639 9.44721L17.7764 15.4472L18.2236 14.5528L6.22361 8.55279L5.77639 9.44721Z"
        fill={pathColor}
      />
    </SvgIcon>
  );
});

RightDirectionIcon.displayName = "RightDirectionIcon";
