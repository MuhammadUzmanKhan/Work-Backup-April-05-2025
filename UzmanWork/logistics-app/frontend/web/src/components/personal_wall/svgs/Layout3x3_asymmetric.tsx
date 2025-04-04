import { Box } from "@mui/material";
import { LayoutSVGProps } from "./utils";

export function Layout3x3Asymmetric({ color, width }: LayoutSVGProps) {
  return (
    <Box sx={{ width: width }}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="14" width="6" height="6" rx="1" fill={color} />
        <rect x="14" y="7" width="6" height="6" rx="1" fill={color} />
        <rect x="14" y="14" width="6" height="6" rx="1" fill={color} />
        <rect x="7" y="14" width="6" height="6" rx="1" fill={color} />
        <rect y="14" width="6" height="6" rx="1" fill={color} />
        <rect width="13" height="13" rx="1" fill={color} />
      </svg>
    </Box>
  );
}
