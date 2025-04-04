import { type SvgIconProps, SvgIcon } from "@mui/material";
import { forwardRef } from "react";

export const FaceUploadPlaceholder = forwardRef<SVGSVGElement, SvgIconProps>(
  (props, ref) => {
    return (
      <SvgIcon {...props} viewBox="0 0 64 64" fill="none" ref={ref}>
        <path
          d="M17 2H12C6.47715 2 2 6.47715 2 12V17M47 2H52C57.5228 2 62 6.47715 62 12V17M2 47V52C2 57.5228 6.47715 62 12 62H17M47 62H52C57.5228 62 62 57.5228 62 52V47"
          stroke="#3C3E49"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 42V42C26.5668 48.7721 37.4332 48.7721 44 42V42"
          stroke="#3C3E49"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M44 20V24"
          stroke="#3C3E49"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 20V24"
          stroke="#3C3E49"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M32 25V32.9296C32 33.5983 31.6658 34.2228 31.1094 34.5937L29 36"
          stroke="#3C3E49"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </SvgIcon>
    );
  }
);

FaceUploadPlaceholder.displayName = "FaceUploadPlaceholder";
