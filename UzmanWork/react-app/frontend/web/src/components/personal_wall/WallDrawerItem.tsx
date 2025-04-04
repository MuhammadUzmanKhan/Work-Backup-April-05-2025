import { ThumbnailResponse } from "coram-common-utils";
import { VideocamOff as VideocamOffIcon } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import { Box, CircularProgress, useTheme } from "@mui/material";

interface WallDrawerItemProps {
  mostRecentThumbnail: ThumbnailResponse | undefined;
  isFetching: boolean;
  imageSx?: SxProps;
}

export function WallDrawerItem({
  mostRecentThumbnail,
  isFetching,
  imageSx,
}: WallDrawerItemProps) {
  const theme = useTheme();

  return mostRecentThumbnail != undefined &&
    mostRecentThumbnail.s3_signed_url ? (
    <Box
      component="img"
      src={mostRecentThumbnail.s3_signed_url}
      sx={{
        maxWidth: "40%",
        maxHeight: "30%",
        borderRadius: "0.4rem",
        verticalAlign: "middle",
        ...imageSx,
      }}
    ></Box>
  ) : isFetching ? (
    <CircularProgress size="20px" />
  ) : (
    // If there is no thumbnail, we show an icon.
    <VideocamOffIcon
      fontSize="small"
      sx={{ color: theme.palette.common.black }}
    />
  );
}
