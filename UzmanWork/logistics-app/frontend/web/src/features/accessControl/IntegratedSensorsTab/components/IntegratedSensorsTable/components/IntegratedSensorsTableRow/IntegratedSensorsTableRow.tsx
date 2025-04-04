import {
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CameraGroupWithLocations,
  CameraResponse,
  Location,
  isDefined,
  MountIf,
} from "coram-common-utils";
import {
  AccessPointCamerasLiveVideosTableRow,
  SelectCamerasTableCell,
  SetLocationTableCell,
  UnlockAccessPointTableCell,
} from "./components";
import { SUPPORTED_VENDORS } from "features/accessControl/consts";
import type { QueryObserverResult } from "react-query";
import { AccessPointResponse } from "features/accessControl/types";
import {
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp as UpIcon,
} from "@mui/icons-material";
import { useState } from "react";

export interface IntegratedSensorsTableRowProps {
  accessPoint: AccessPointResponse;
  locations: Map<number, Location>;
  cameraGroups: Map<number, CameraGroupWithLocations>;
  cameras: CameraResponse[];
  refetchAccessPoints: () => Promise<
    QueryObserverResult<AccessPointResponse[]>
  >;
}

export function IntegratedSensorsTableRow({
  accessPoint,
  locations,
  cameraGroups,
  cameras,
  refetchAccessPoints,
}: IntegratedSensorsTableRowProps) {
  const [showCameras, setShowCameras] = useState(false);
  const hasNoCameras = accessPoint.cameras.length === 0;

  const accessPointCameras = cameras.filter((camera) =>
    accessPoint.cameras.some(
      (accessPointCamera) =>
        accessPointCamera.mac_address === camera.camera.mac_address
    )
  );

  return (
    <>
      <TableRow>
        <TableCell>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="start"
            alignItems="center"
          >
            <IconButton
              size="small"
              disabled={hasNoCameras}
              onClick={() => setShowCameras(!showCameras)}
            >
              {showCameras ? <UpIcon /> : <DownIcon />}
            </IconButton>
            {SUPPORTED_VENDORS[accessPoint.vendor]?.icon}
            <Stack>
              <Typography variant="body2">{accessPoint.name}</Typography>
              <Typography variant="body3" color="#83889E">
                {SUPPORTED_VENDORS[accessPoint.vendor]?.name}
              </Typography>
            </Stack>
          </Stack>
        </TableCell>
        <SetLocationTableCell
          accessPoint={accessPoint}
          locations={locations}
          refetchAccessPoints={refetchAccessPoints}
        />
        <SelectCamerasTableCell
          accessPoint={accessPoint}
          refetchAccessPoints={refetchAccessPoints}
          cameras={cameras}
          cameraGroups={[...cameraGroups.values()]}
          location={
            isDefined(accessPoint.location_id)
              ? locations.get(accessPoint.location_id)
              : undefined
          }
        />
        <UnlockAccessPointTableCell
          isRemoteUnlockEnabled={accessPoint.remote_unlock_enabled}
          accessPointId={accessPoint.id}
          vendor={accessPoint.vendor}
        />
      </TableRow>
      <MountIf condition={showCameras}>
        <AccessPointCamerasLiveVideosTableRow cameras={accessPointCameras} />
      </MountIf>
    </>
  );
}
