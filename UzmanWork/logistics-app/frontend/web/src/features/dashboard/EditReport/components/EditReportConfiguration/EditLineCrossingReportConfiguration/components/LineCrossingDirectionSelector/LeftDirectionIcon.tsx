import { SvgIcon, type SvgIconProps, useTheme } from "@mui/material";
import { forwardRef } from "react";

export const LeftDirectionIcon = forwardRef<
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
        d="M5.84189 8.52566C5.57991 8.61298 5.43833 8.89614 5.52566 9.15811L6.94868 13.4272C7.03601 13.6892 7.31917 13.8307 7.58114 13.7434C7.84311 13.6561 7.98469 13.3729 7.89737 13.111L6.63246 9.31623L10.4272 8.05132C10.6892 7.96399 10.8307 7.68083 10.7434 7.41886C10.6561 7.15689 10.3729 7.01531 10.111 7.10263L5.84189 8.52566ZM17.7764 15.4472C18.0234 15.5707 18.3237 15.4706 18.4472 15.2236C18.5707 14.9766 18.4706 14.6763 18.2236 14.5528L17.7764 15.4472ZM5.77639 9.44721L17.7764 15.4472L18.2236 14.5528L6.22361 8.55279L5.77639 9.44721Z"
        fill={pathColor}
      />
    </SvgIcon>
  );
});

LeftDirectionIcon.displayName = "LeftDirectionIcon";
