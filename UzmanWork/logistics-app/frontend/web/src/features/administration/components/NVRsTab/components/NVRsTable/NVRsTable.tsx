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
import { SortHeadCell } from "components/SortHeadCell";
import { NVRsSortKeys } from "../../types";
import { NoResultFoundPlaceholder } from "components/common";
import { NVRTableRow } from "./NVRTableRow";
import { Sortable } from "utils/sortable";
import { CameraResponse, NVRResponse } from "coram-common-utils";
import { useMemo } from "react";

interface NVRsTableProps {
  isDataLoading: boolean;
  nvrs: NVRResponse[];
  cameras: CameraResponse[];
  sortable: Sortable<NVRsSortKeys>;
  onNVRSettingsClick: (nvr: NVRResponse) => void;
}

export function NVRsTable({
  isDataLoading,
  nvrs,
  cameras,
  sortable,
  onNVRSettingsClick,
}: NVRsTableProps) {
  const camerasByNVR = useMemo(
    () =>
      cameras.reduce((acc, camera) => {
        const nvrUuid = camera.camera.nvr_uuid;
        const existingCameras = acc.get(nvrUuid) ?? [];
        acc.set(nvrUuid, [...existingCameras, camera]);
        return acc;
      }, new Map<string, CameraResponse[]>()),
    [cameras]
  );

  return (
    <TableContainer component={Paper} sx={{ height: "76vh" }}>
      <Table stickyHeader sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <SortHeadCell<NVRsSortKeys> sortKey="uuid" sortable={sortable}>
              NVR
            </SortHeadCell>
            <SortHeadCell<NVRsSortKeys> sortKey="org_name" sortable={sortable}>
              Organisation
            </SortHeadCell>
            <TableCell>Last Online</TableCell>
            <TableCell>Online Cameras</TableCell>
            <TableCell>All Cameras</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Settings</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isDataLoading ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ border: "none" }}>
                <Stack padding="28vh 0" alignItems="center">
                  <CircularProgress color="secondary" />
                </Stack>
              </TableCell>
            </TableRow>
          ) : nvrs.length > 0 ? (
            nvrs.map((nvr) => (
              <NVRTableRow
                key={nvr.uuid}
                nvr={nvr}
                cameras={camerasByNVR.get(nvr.uuid) ?? []}
                onNVRSettingsClick={onNVRSettingsClick}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ border: "none" }}>
                <NoResultFoundPlaceholder
                  padding="26vh 0"
                  alignItems="center"
                  text="No NVRs found"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
