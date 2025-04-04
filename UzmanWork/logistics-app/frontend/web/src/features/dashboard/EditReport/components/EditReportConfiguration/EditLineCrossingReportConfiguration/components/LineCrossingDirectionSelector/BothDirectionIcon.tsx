import { SvgIcon, type SvgIconProps, useTheme } from "@mui/material";
import { forwardRef } from "react";

export const BothDirectionIcon = forwardRef<
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
        d="M5.84189 8.52566C5.57991 8.61298 5.43833 8.89614 5.52566 9.15811L6.94868 13.4272C7.03601 13.6892 7.31917 13.8307 7.58114 13.7434C7.84311 13.6561 7.98469 13.3729 7.89737 13.111L6.63246 9.31623L10.4272 8.05132C10.6892 7.96399 10.8307 7.68083 10.7434 7.41886C10.6561 7.15689 10.3729 7.01531 10.111 7.10263L5.84189 8.52566ZM18.1581 15.4743C18.4201 15.387 18.5617 15.1039 18.4743 14.8419L17.0513 10.5728C16.964 10.3108 16.6808 10.1693 16.4189 10.2566C16.1569 10.3439 16.0153 10.6271 16.1026 10.889L17.3675 14.6838L13.5728 15.9487C13.3108 16.036 13.1693 16.3192 13.2566 16.5811C13.3439 16.8431 13.6271 16.9847 13.889 16.8974L18.1581 15.4743ZM5.77639 9.44721L17.7764 15.4472L18.2236 14.5528L6.22361 8.55279L5.77639 9.44721Z"
        fill={pathColor}
      />
    </SvgIcon>
  );
});

BothDirectionIcon.displayName = "BothDirectionIcon";
