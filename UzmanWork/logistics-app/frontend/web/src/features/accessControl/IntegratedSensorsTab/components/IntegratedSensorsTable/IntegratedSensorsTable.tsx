import {
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { IntegratedSensorsTableRow } from "./components";
import { QueryObserverResult } from "react-query";
import { AccessPointResponse } from "features/accessControl/types";
import {
  useCameraGroupsWithLocation,
  useCamerasList,
  useLocations,
} from "coram-common-utils";

export interface IntegratedSensorsTableProps {
  accessPoints: AccessPointResponse[];
  refetchAccessPoints: () => Promise<
    QueryObserverResult<AccessPointResponse[]>
  >;
}

export function IntegratedSensorsTable({
  accessPoints,
  refetchAccessPoints,
}: IntegratedSensorsTableProps) {
  const { isLoading: isLoadingLocations, data: locations } = useLocations();
  const { isLoading: isLoadingCameraGroups, data: cameraGroups } =
    useCameraGroupsWithLocation();
  const { isLoading: isLoadingCameras, data: cameras } = useCamerasList({});

  const isLoadingData =
    isLoadingLocations || isLoadingCameraGroups || isLoadingCameras;

  return (
    <TableContainer component={Paper} sx={{ height: "80vh" }}>
      <Table stickyHeader sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell>Sensor</TableCell>
            <TableCell>Set Location</TableCell>
            <TableCell>Assign Cameras</TableCell>
            <TableCell width="15%">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoadingData ? (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ border: "none" }}>
                <Stack padding="28vh 0" alignItems="center">
                  <CircularProgress color="secondary" />
                </Stack>
              </TableCell>
            </TableRow>
          ) : (
            accessPoints.map((accessPoint) => (
              <IntegratedSensorsTableRow
                key={accessPoint.id}
                accessPoint={accessPoint}
                locations={locations}
                cameraGroups={cameraGroups}
                cameras={cameras}
                refetchAccessPoints={refetchAccessPoints}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
