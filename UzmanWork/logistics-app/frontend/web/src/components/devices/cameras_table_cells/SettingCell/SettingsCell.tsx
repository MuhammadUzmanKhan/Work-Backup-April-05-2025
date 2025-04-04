import { Typography } from "@mui/material";
import { CameraResponse, ThumbnailResponse } from "coram-common-utils";
import { useState } from "react";
import { CameraSettingsDrawer } from "features/devices";
import { QueryObserverResult } from "react-query";

interface SettingsCellProps {
  stream: CameraResponse;
  thumbnail: ThumbnailResponse | undefined;
  refetchCameras: () => Promise<QueryObserverResult<CameraResponse[]>>;
}

export function SettingsCell({
  stream,
  thumbnail,
  refetchCameras,
}: SettingsCellProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Typography
        variant="body1"
        onClick={() => setOpen(true)}
        sx={{ color: "primary.main", cursor: "pointer" }}
      >
        Settings
      </Typography>
      <CameraSettingsDrawer
        open={open}
        stream={stream}
        thumbnail={thumbnail}
        onClose={() => setOpen(false)}
        refetchCameras={refetchCameras}
      />
    </>
  );
}
