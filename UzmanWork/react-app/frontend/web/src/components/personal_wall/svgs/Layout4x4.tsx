import { Box } from "@mui/material";
import { LayoutSVGProps } from "./utils";

export function Layout4x4({ color, width }: LayoutSVGProps) {
  return (
    <Box sx={{ width: width }}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="4.25" height="4.25" rx="1" fill={color} />
        <rect x="5.25" width="4.25" height="4.25" rx="1" fill={color} />
        <rect x="10.5" width="4.25" height="4.25" rx="1" fill={color} />
        <rect x="15.75" width="4.25" height="4.25" rx="1" fill={color} />
        <rect y="5.25" width="4.25" height="4.25" rx="1" fill={color} />
        <rect
          x="5.25"
          y="5.25"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect
          x="10.5"
          y="5.25"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect
          x="15.75"
          y="5.25"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect y="10.5" width="4.25" height="4.25" rx="1" fill={color} />
        <rect
          x="5.25"
          y="10.5"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect
          x="10.5"
          y="10.5"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect
          x="15.75"
          y="10.5"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect y="15.75" width="4.25" height="4.25" rx="1" fill={color} />
        <rect
          x="5.25"
          y="15.75"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect
          x="10.5"
          y="15.75"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
        <rect
          x="15.75"
          y="15.75"
          width="4.25"
          height="4.25"
          rx="1"
          fill={color}
        />
      </svg>
    </Box>
  );
}
