import { Stack, TableCell, TableRow } from "@mui/material";
import { AccessControlEventClip } from "./AccessControlEventClip";
import { AccessPointEventCameraInfo } from "features/accessControl/types";

interface EventDetailTableRowProps {
  cameras: AccessPointEventCameraInfo[];
}

export function EventDetailTableRow({ cameras }: EventDetailTableRowProps) {
  return (
    <TableRow
      sx={{
        "& td": { borderLeft: 0 },
        backgroundColor: "rgba(99, 93, 255, 0.05)",
      }}
    >
      <TableCell style={{ padding: 0 }} colSpan={5}>
        <Stack
          direction="row"
          gap={2}
          p="0.5rem 3rem"
          flexDirection="row-reverse"
        >
          {cameras.map((camera) => (
            <AccessControlEventClip
              key={camera.macAddress}
              clip={camera.clip}
            />
          ))}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
