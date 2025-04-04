import { SvgIcon, type SvgIconProps } from "@mui/material";
import { forwardRef } from "react";

export const NoCommentsIcon = forwardRef<SVGSVGElement, SvgIconProps>(
  (props, ref) => {
    return (
      <SvgIcon {...props} viewBox="0 0 49 48" fill="none" ref={ref}>
        <path
          d="M12.2295 33.8303C12.4855 33.5064 12.516 33.0584 12.3064 32.7027C10.8068 30.1582 9.94444 27.1829 9.94444 24C9.94444 14.5994 17.4678 7 26.7222 7C35.9767 7 43.5 14.5994 43.5 24C43.5 33.4006 35.9767 41 26.7222 41C24.079 41 21.5808 40.3814 19.3587 39.2797C19.1824 39.1923 18.9842 39.1589 18.7889 39.1836L6.80101 40.7008L12.2295 33.8303Z"
          stroke="#83889E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="20.5" cy="24" r="2" fill="#83889E" />
        <circle cx="26.5" cy="24" r="2" fill="#83889E" />
        <circle cx="32.5" cy="24" r="2" fill="#83889E" />
      </SvgIcon>
    );
  }
);

NoCommentsIcon.displayName = "NoCommentsIcon";
