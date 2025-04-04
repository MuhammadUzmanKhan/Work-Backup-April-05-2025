import { Stack } from "@mui/material";
import { CameraResponse } from "coram-common-utils";
import { UpdateCameraGroup } from "./UpdateCameraGroup";

interface GroupCellProps {
  stream: CameraResponse;
  refetchStreams: () => void;
}

export function GroupCell({ stream, refetchStreams }: GroupCellProps) {
  return (
    <Stack direction="row">
      <UpdateCameraGroup camera={stream} refetch={refetchStreams} />
    </Stack>
  );
}
