import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  Typography,
  TableCell,
  TableBody,
  TableRow,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { SortHeadCell } from "components/SortHeadCell";
import { StyledPasswordTextField } from "components/styled_components/StyledPasswordTextField";
import { StyledUsernameTextField } from "components/styled_components/StyledUsernameTextField";
import { ChangeEvent, Dispatch, SetStateAction, useMemo } from "react";
import { CandidateCamera } from "../../../types";
import { mapVendor } from "utils/camera_vendors";
import { useSortable } from "utils/sortable";
import { sortCandidateCameras } from "./utils";
import {
  onCameraPasswordChange,
  onCameraUsernameChange,
} from "features/camera_registration/utils";

export type CamerasTableSortKeys = "vendor" | "ip" | "mac_address";

// TODO(@lberg): handle adding cameras
interface CameraRegistrationTableProps {
  candidateCameras: CandidateCamera[];
  onCameraToggle: (macAddress: string) => void;
  onAllCamerasToggle: (selected: boolean) => void;
  setCandidateCameras: Dispatch<SetStateAction<CandidateCamera[]>>;
}

export function CameraRegistrationTable({
  candidateCameras,
  onCameraToggle,
  onAllCamerasToggle,
  setCandidateCameras,
}: CameraRegistrationTableProps) {
  const sortable = useSortable<CamerasTableSortKeys>("ip");

  candidateCameras = useMemo(
    () =>
      sortCandidateCameras(candidateCameras, sortable.order, sortable.orderBy),
    [candidateCameras, sortable.order, sortable.orderBy]
  );

  const numSelected = candidateCameras.filter(
    (candidate) => candidate.selected
  ).length;

  return (
    <TableContainer component={Paper} sx={{ maxHeight: "100%" }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell align="left">
              <FormControlLabel
                control={
                  <Checkbox
                    color="secondary"
                    indeterminate={
                      numSelected > 0 && numSelected < candidateCameras.length
                    }
                    checked={
                      candidateCameras.length > 0 &&
                      numSelected === candidateCameras.length
                    }
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onAllCamerasToggle(e.target.checked)
                    }
                  />
                }
                label="Camera"
              />
            </TableCell>
            <SortHeadCell<CamerasTableSortKeys>
              sortKey="vendor"
              sortable={sortable}
            >
              <Typography variant="body2">Vendor</Typography>
            </SortHeadCell>

            <SortHeadCell<CamerasTableSortKeys>
              sortKey="ip"
              sortable={sortable}
            >
              <Typography variant="body2">IP Address</Typography>
            </SortHeadCell>

            <SortHeadCell<CamerasTableSortKeys>
              sortKey="mac_address"
              sortable={sortable}
            >
              <Typography variant="body2">Mac Address</Typography>
            </SortHeadCell>

            <TableCell align="left">
              <Typography variant="body2">Username</Typography>
            </TableCell>
            <TableCell align="left">
              <Typography variant="body2">Password</Typography>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {candidateCameras.map((candidate) => (
            <TableRow
              key={candidate.data.mac_address}
              sx={{
                "&:last-child td, &:last-child th": { borderBottom: 0 },
              }}
              selected={candidate.selected}
            >
              <TableCell>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="secondary"
                      checked={candidate.selected}
                      onChange={() =>
                        onCameraToggle(candidate.data.mac_address)
                      }
                    />
                  }
                  label={candidate.idx}
                />
              </TableCell>
              <TableCell>{mapVendor(candidate.data.vendor)}</TableCell>
              <TableCell>{candidate.data.ip}</TableCell>
              <TableCell>{candidate.data.mac_address}</TableCell>
              <TableCell>
                <StyledUsernameTextField
                  value={candidate.data.username ?? ""}
                  onChange={(e) => {
                    const username = e.target.value;
                    onCameraUsernameChange(
                      candidate.data.mac_address,
                      username,
                      setCandidateCameras
                    );
                  }}
                />
              </TableCell>
              <TableCell>
                <StyledPasswordTextField
                  value={candidate.data.password ?? ""}
                  onChange={(e) => {
                    const password = e.target.value;
                    onCameraPasswordChange(
                      candidate.data.mac_address,
                      password,
                      setCandidateCameras
                    );
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
