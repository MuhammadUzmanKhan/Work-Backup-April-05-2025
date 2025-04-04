import { Box } from "@mui/material";
import { LayoutSVGProps } from "./utils";

export function Layout2x2({ color, width }: LayoutSVGProps) {
  return (
    <Box sx={{ width: width }}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="9.5" height="9.5" rx="1" fill={color} />
        <rect x="10.5" width="9.5" height="9.5" rx="1" fill={color} />
        <rect y="10.5" width="9.5" height="9.5" rx="1" fill={color} />
        <rect x="10.5" y="10.5" width="9.5" height="9.5" rx="1" fill={color} />
      </svg>
    </Box>
  );
}
