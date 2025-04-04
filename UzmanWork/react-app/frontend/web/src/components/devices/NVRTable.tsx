import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  CameraResponse,
  NVRResponse,
  DEFAULT_TIMEZONE,
} from "coram-common-utils";
import { useEffect, useState } from "react";
import { NvrDetailsTableCell } from "./nvr_table_cells/NvrDetailsTableCell";
import { NameCell } from "./nvr_table_cells/NameCell";
import { ConnectionStatusTableCell } from "./nvr_table_cells/ConnectionStatusTableCell";
import { PaginationData } from "./PaginationUtils";
import { NVRLocationSelector } from "./nvr_table_cells/NVRLocationSelector";
import { QueryObserverResult } from "react-query";
import { NVRTableSortKeys, sortNVRs, tableRowStyles } from "./utils";
import { useSortable } from "utils/sortable";
import { SortHeadCell } from "components/SortHeadCell";
interface NVRTableProps {
  nvrs: NVRResponse[];
  cameras: CameraResponse[];
  paginationData: PaginationData;
  refetchNvrs: () => Promise<QueryObserverResult<NVRResponse[]>>;
}

export function NVRTable({
  nvrs,
  cameras,
  paginationData,
  refetchNvrs,
}: NVRTableProps) {
  const [camerasPerNvr, setCamerasPerNvr] = useState<
    Map<string, CameraResponse[]>
  >(new Map<string, CameraResponse[]>());
  const sortable = useSortable<NVRTableSortKeys>("location");
  const sortedNVRs = sortNVRs(nvrs, sortable.orderBy, sortable.order);
  // Update the mapping whenever the cameras or nvrs change
  useEffect(() => {
    setCamerasPerNvr(
      cameras.reduce(
        (acc: Map<string, CameraResponse[]>, camera: CameraResponse) => {
          if (!acc.has(camera.camera.nvr_uuid)) {
            acc.set(camera.camera.nvr_uuid, []);
          }
          acc.get(camera.camera.nvr_uuid)?.push(camera);
          return acc;
        },
        new Map<string, CameraResponse[]>()
      )
    );
  }, [cameras, nvrs]);

  return (
    <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: "none" }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography variant="body2">Appliances</Typography>
            </TableCell>
            <SortHeadCell<NVRTableSortKeys>
              sortKey="location"
              sortable={sortable}
            >
              <Typography variant="body2">Location</Typography>
            </SortHeadCell>
            <SortHeadCell<NVRTableSortKeys>
              sortKey="status"
              sortable={sortable}
            >
              <Typography variant="body2">Status</Typography>
            </SortHeadCell>
            <TableCell align="left">
              <Typography variant="body2">Details</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedNVRs
            .slice(
              paginationData.page * paginationData.itemsPerPage,
              (paginationData.page + 1) * paginationData.itemsPerPage
            )
            .sort((a, b) => (a.uuid > b.uuid ? 1 : -1))
            .map((nvr) => (
              <TableRow
                key={nvr.id}
                sx={{
                  ...tableRowStyles,
                }}
              >
                <TableCell>
                  <NameCell nvr={nvr} />
                </TableCell>
                <TableCell width={300}>
                  <NVRLocationSelector
                    nvrUuid={nvr.uuid}
                    nvrLocationId={nvr.location_id}
                    nvrLocationName={nvr.location_name}
                  />
                </TableCell>
                <ConnectionStatusTableCell
                  isOnline={nvr.is_online}
                  lastSeenTime={nvr.last_seen_time}
                  internetStatus={nvr.internet_status}
                  kvsConnectionStatus={nvr.kvs_connection_status}
                  timezone={nvr.timezone ?? DEFAULT_TIMEZONE}
                />
                <TableCell align="left">
                  <NvrDetailsTableCell
                    nvr={nvr}
                    nvrCameras={camerasPerNvr.get(nvr.uuid) ?? []}
                    refetchNvrs={refetchNvrs}
                  />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
