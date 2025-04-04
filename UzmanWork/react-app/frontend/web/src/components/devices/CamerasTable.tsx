import {
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddCircleOutline as AddCircleOutlineIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
} from "@mui/icons-material";
import { CameraResponse } from "coram-common-utils";
import { PaginationData } from "./PaginationUtils";
import { EnableCell } from "./cameras_table_cells/EnableCell";
import { GroupCell } from "./cameras_table_cells/GroupCell";
import { SettingsCell } from "./cameras_table_cells/SettingCell";
import { NameCell } from "./cameras_table_cells/NameCell";
import { StatusCell } from "./cameras_table_cells/StatusCell";
import { tableRowStyles, useCameraRenderData } from "./utils";
import { SortHeadCell } from "components/SortHeadCell";
import type { QueryObserverResult } from "react-query";
import { useSortable } from "utils/sortable";
import { ActionButton } from "components/styled_components/ActionButton";

export type CamerasTableSortKeys =
  | "name"
  | "location"
  | "group"
  | "status"
  | "activate";

const TableRowPadded = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== "reducePadding",
})<{ reducePadding?: boolean }>(({ theme, reducePadding }) => {
  if (reducePadding) {
    // Reduce padding for children
    return {
      "& .MuiTableCell-root": {
        padding: theme.spacing(0.15, 1),
      },
    };
  }
  return {};
});

interface CamerasTableProps {
  data: CameraResponse[];
  paginationData: PaginationData;
  refetchStreams: () => Promise<QueryObserverResult<CameraResponse[]>>;
  showFullInfo: boolean;
  onShowFullInfoChange?: (showFullInfo: boolean) => void;
}

export function CamerasTable({
  data,
  paginationData,
  refetchStreams,
  showFullInfo,
  onShowFullInfoChange,
}: CamerasTableProps) {
  const sortable = useSortable<CamerasTableSortKeys>("name");

  const { visibleData, mostRecentThumbnails, cameraPipelineAlerts } =
    useCameraRenderData(
      data,
      paginationData.page,
      paginationData.itemsPerPage,
      sortable.order,
      sortable.orderBy
    );

  return (
    <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: "none" }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <SortHeadCell<CamerasTableSortKeys>
              sortKey="name"
              sortable={sortable}
            >
              <Tooltip
                title={
                  showFullInfo ? "Hide camera preview" : "Show camera preview"
                }
              >
                <ActionButton
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onShowFullInfoChange?.(!showFullInfo);
                  }}
                >
                  {showFullInfo ? (
                    <RemoveCircleOutlineIcon fontSize="small" />
                  ) : (
                    <AddCircleOutlineIcon fontSize="small" />
                  )}
                </ActionButton>
              </Tooltip>
              <Typography variant="body2" marginLeft={1}>
                Camera
              </Typography>
            </SortHeadCell>
            <SortHeadCell<CamerasTableSortKeys>
              sortKey="location"
              sortable={sortable}
            >
              <Typography variant="body2">Location</Typography>
            </SortHeadCell>
            <SortHeadCell<CamerasTableSortKeys>
              sortKey="group"
              sortable={sortable}
            >
              <Typography variant="body2">Group</Typography>
            </SortHeadCell>

            <SortHeadCell<CamerasTableSortKeys>
              sortKey="status"
              sortable={sortable}
            >
              <Typography variant="body2">Status</Typography>
            </SortHeadCell>
            <TableCell align="left">
              <Typography variant="body2">Settings</Typography>
            </TableCell>
            <SortHeadCell<CamerasTableSortKeys>
              sortKey="activate"
              sortable={sortable}
            >
              <Typography variant="body2">Activate</Typography>
            </SortHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleData.map((stream) => (
            <TableRowPadded
              key={stream.camera.id}
              sx={{
                ...tableRowStyles,
              }}
              reducePadding={!showFullInfo}
            >
              <TableCell sx={{ minWidth: "300px", cursor: "pointer" }}>
                <NameCell
                  stream={stream}
                  refetch={refetchStreams}
                  thumbnail={mostRecentThumbnails.get(
                    stream.camera.mac_address
                  )}
                  thumbnailHeight={75}
                  thumbnailWidth={100}
                  showFullInfo={showFullInfo}
                />
              </TableCell>
              <TableCell>
                <Typography variant="body1">{stream.location}</Typography>
              </TableCell>
              <TableCell width={250}>
                <GroupCell stream={stream} refetchStreams={refetchStreams} />
              </TableCell>
              <TableCell>
                <StatusCell
                  camera={stream}
                  cameraPipelineAlert={
                    cameraPipelineAlerts.alerts_info[stream.camera.mac_address]
                  }
                />
              </TableCell>
              <TableCell align="left">
                <SettingsCell
                  stream={stream}
                  refetchCameras={refetchStreams}
                  thumbnail={mostRecentThumbnails.get(
                    stream.camera.mac_address
                  )}
                />
              </TableCell>
              <TableCell sx={{ maxWidth: "120px" }}>
                <EnableCell stream={stream} refetch={refetchStreams} />
              </TableCell>
            </TableRowPadded>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
