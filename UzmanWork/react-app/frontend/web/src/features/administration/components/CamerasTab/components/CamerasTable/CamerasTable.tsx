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
import { CamerasSortKeys } from "../../types";
import { NoResultFoundPlaceholder } from "components/common";
import { CameraTableRow } from "./CameraTableRow";
import { Sortable } from "utils/sortable";
import { CameraResponse } from "coram-common-utils";

interface CamerasTableProps {
  isDataLoading: boolean;
  cameras: CameraResponse[];
  sortable: Sortable<CamerasSortKeys>;
  onCameraSettingsClick: (nvr: CameraResponse) => void;
}

export function CamerasTable({
  isDataLoading,
  cameras,
  sortable,
  onCameraSettingsClick,
}: CamerasTableProps) {
  return (
    <TableContainer component={Paper} sx={{ height: "76vh" }}>
      <Table stickyHeader sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <SortHeadCell<CamerasSortKeys>
              sortKey="nvr_name"
              sortable={sortable}
            >
              Name
            </SortHeadCell>
            <TableCell>Organisation</TableCell>
            <TableCell>CVR</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>MAC</TableCell>
            <TableCell>IP</TableCell>
            <TableCell>Vendor</TableCell>
            <TableCell width="8%">Resolution</TableCell>
            <TableCell width="4%">FPS</TableCell>
            <TableCell width="6%">Status</TableCell>
            <TableCell width="7%">Settings</TableCell>
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
          ) : cameras.length > 0 ? (
            cameras.map((camera) => (
              <CameraTableRow
                key={camera.camera.id}
                camera={camera}
                onCameraSettingsClick={onCameraSettingsClick}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} align="center" sx={{ border: "none" }}>
                <NoResultFoundPlaceholder
                  padding="26vh 0"
                  alignItems="center"
                  text="No Cameras found"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
