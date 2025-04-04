import { Typography } from "@mui/material";
import { CameraResponse, NVRResponse } from "coram-common-utils";
import { useState } from "react";
import { NVRDetailsDrawer } from "features/devices";

interface MoreInfoCellProps {
  nvr: NVRResponse;
  nvrCameras: CameraResponse[];
  refetchNvrs: () => Promise<unknown>;
}

export function NvrDetailsTableCell({
  nvr,
  nvrCameras,
  refetchNvrs,
}: MoreInfoCellProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Typography
        variant="body2"
        onClick={() => setOpen(true)}
        sx={{ color: "primary.main", cursor: "pointer" }}
      >
        Details
      </Typography>
      <NVRDetailsDrawer
        nvr={nvr}
        nvrCameras={nvrCameras}
        open={open}
        onClose={() => setOpen(false)}
        refetchNvrs={refetchNvrs}
      />
    </>
  );
}
