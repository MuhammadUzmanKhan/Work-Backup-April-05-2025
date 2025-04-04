import {
  Box,
  IconButton,
  Paper,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { SortHeadCell } from "components/SortHeadCell";
import { PaginationData } from "components/devices/PaginationUtils";
import {
  FaceAlertResponse,
  FaceAlertService,
  useCamerasMap,
} from "coram-common-utils";
import { useNotificationGroups } from "utils/globals";
import { PersonOfInterestTableRow } from "./PersonOfInterestTableRow";
import { useSortable } from "utils/sortable";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import { useContext, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import {
  PersonOfInterestTableSortKeys,
  usePersonOfInterestRenderData,
} from "../hooks";
import { NotificationInfo } from "components/analytics/NotificationInfo";

// TODO: add storybook https://orcamobilityai.atlassian.net/browse/VAS-2410

interface LicensePlateTableProps {
  faceAlerts: FaceAlertResponse[];
  paginationData: PaginationData;
  setSelectedFaceProfileId: (faceId: number | null) => void;
}

export function PersonOfInterestTable({
  faceAlerts,
  paginationData,
  setSelectedFaceProfileId,
}: LicensePlateTableProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { setNotificationData } = useContext(NotificationContext);

  const { data: cameras } = useCamerasMap({
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const sortable = useSortable<PersonOfInterestTableSortKeys>(
    "last_seen",
    "desc"
  );

  const visibleFaceAlerts = usePersonOfInterestRenderData(
    cameras,
    faceAlerts,
    paginationData.page,
    paginationData.itemsPerPage,
    sortable.order,
    sortable.orderBy
  );

  const [deletedFaceProfileIds, setDeletedFaceProfileIds] = useState(
    new Set<number>()
  );

  const filteredVisibleFaceAlerts = visibleFaceAlerts.filter(
    (faceAlert) => !deletedFaceProfileIds.has(faceAlert.face_profile_id)
  );

  async function handleFaceAlertProfileDelete(faceProfileId: number) {
    try {
      await FaceAlertService.deleteAlertProfile(faceProfileId);
      setDeletedFaceProfileIds((prev) => new Set([...prev, faceProfileId]));
    } catch (e) {
      setNotificationData({
        message: "Failed to delete person of interest",
        severity: "error",
      });
      console.error(e);
    }
  }

  const {
    data: notificationGroups,
    isFetchedAfterMount: isNotificationGroupsFetched,
  } = useNotificationGroups();

  return (
    <Stack spacing={2} alignItems="flex-end">
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <SortHeadCell<PersonOfInterestTableSortKeys>
                sortKey="person"
                sortable={sortable}
              >
                <Typography variant="body2" marginLeft={1}>
                  Person
                </Typography>
              </SortHeadCell>
              <SortHeadCell<PersonOfInterestTableSortKeys>
                sortKey="last_seen"
                sortable={sortable}
              >
                <Typography variant="body2" marginLeft={1}>
                  Last Seen
                </Typography>
              </SortHeadCell>
              <SortHeadCell<PersonOfInterestTableSortKeys>
                sortKey="location"
                sortable={sortable}
              >
                <Typography variant="body2" marginLeft={1}>
                  Location
                </Typography>
              </SortHeadCell>
              <SortHeadCell<PersonOfInterestTableSortKeys>
                sortKey="camera"
                sortable={sortable}
              >
                <Typography variant="body2" marginLeft={1}>
                  Camera
                </Typography>
              </SortHeadCell>
              <TableCell>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="body2" marginLeft={1}>
                    Enable Notification
                  </Typography>
                  {notificationGroups.size === 0 && (
                    <IconButton
                      sx={{ p: 0 }}
                      onMouseOver={(event) => {
                        setAnchorEl(event.currentTarget);
                      }}
                    >
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          </TableHead>
          {isNotificationGroupsFetched && (
            <TableBody>
              {filteredVisibleFaceAlerts.map((faceAlert) => (
                <PersonOfInterestTableRow
                  key={faceAlert.face_profile_id}
                  faceAlert={faceAlert}
                  camera={cameras.get(
                    faceAlert.unique_face_occurrence.mac_address
                  )}
                  notificationGroups={notificationGroups}
                  handleFaceAlertProfileDelete={handleFaceAlertProfileDelete}
                  onFaceClick={setSelectedFaceProfileId}
                />
              ))}
            </TableBody>
          )}
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Box p={3}>
              <NotificationInfo />
            </Box>
          </Popover>
        </Table>
      </TableContainer>
    </Stack>
  );
}
