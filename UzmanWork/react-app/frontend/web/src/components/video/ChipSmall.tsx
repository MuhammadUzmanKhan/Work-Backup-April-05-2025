import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";
import { ScreenSize, useScreenSize } from "components/layout/DesktopOnly";

export function ChipSmall(props: ChipProps) {
  const { sx, ...other } = props;
  const screenSize = useScreenSize();
  delete other.size;
  return (
    <Chip
      size="small"
      sx={{
        ...sx,
        fontSize: screenSize === ScreenSize.XLarge ? "0.87rem" : "0.77rem",
        height: "27px",
      }}
      {...other}
    />
  );
}
