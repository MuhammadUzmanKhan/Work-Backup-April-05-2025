import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { useLicensePlateRenderData } from "components/devices/utils";
import { PaginationData } from "components/devices/PaginationUtils";
import { SearchFilterContext } from "utils/search_filter";
import { Sortable } from "utils/sortable";
import {
  LicensePlateAlertService,
  LicensePlateResponse,
} from "coram-common-utils";
import { useNotificationGroups } from "utils/globals";
import { LicensePlateTableRow } from "./LicensePlateTableRow";
import { LicensePlateTableHeadRow } from "./LicensePlateTableHeadRow";
import { LicensePlateOfInterestTableRowCell } from "./LicensePlateOfInterestTableRowCell";
import { LicensePlateTableSortKeys } from "./LicensePlateTab";
import { NotificationContext } from "contexts/notification_context";

interface LicensePlateOfInterestTableProps {
  licensePlates: Array<LicensePlateResponse>;
  paginationData: PaginationData;
  setSelectedLicensePlate: (selectedLicensePlate: LicensePlateResponse) => void;
  sortable: Sortable<LicensePlateTableSortKeys>;
}

export function LicensePlateOfInterestTable({
  licensePlates,
  paginationData,
  setSelectedLicensePlate,
  sortable,
}: LicensePlateOfInterestTableProps) {
  const analyticsFilterContext = useContext(SearchFilterContext);
  const { setNotificationData } = useContext(NotificationContext);

  const visibleLicensePlates = useLicensePlateRenderData(
    licensePlates,
    paginationData.page,
    paginationData.itemsPerPage,
    sortable.order,
    sortable.orderBy,
    analyticsFilterContext.filter.searchQuery
  );

  const [deletedLicensePlateProfileIds, setDeletedLicensePlateProfileIds] =
    useState(new Set<number>());

  const visibleLicensePlatesFiltered = visibleLicensePlates.filter((item) => {
    const alertProfileId = item.license_plate?.alert_profile?.id ?? -1;
    return !deletedLicensePlateProfileIds.has(alertProfileId);
  });

  async function handleLicensePlateProfileDelete(
    licensePlateProfileId: number
  ) {
    try {
      await LicensePlateAlertService.deleteAlertProfile(licensePlateProfileId);
      setDeletedLicensePlateProfileIds(
        (prev) => new Set([...prev, licensePlateProfileId])
      );
    } catch (e) {
      setNotificationData({
        message: "Failed to delete license plate of interest",
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
        <Table sx={{ minWidth: 250 }}>
          <TableHead>
            <TableRow>
              <LicensePlateTableHeadRow sortable={sortable} />
              <TableCell>
                <Typography variant="body2" fontWeight="600" marginLeft={1}>
                  Enable Notification
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          {isNotificationGroupsFetched && (
            <TableBody>
              {visibleLicensePlatesFiltered.map(
                (item) =>
                  item.license_plate.alert_profile && (
                    <TableRow
                      key={
                        item.license_plate.license_plate_number +
                        item.license_plate.last_seen
                      }
                      sx={{
                        "&:last-child td, &:last-child th": { borderBottom: 0 },
                      }}
                    >
                      <LicensePlateTableRow
                        item={item}
                        setSelectedLicensePlate={setSelectedLicensePlate}
                        onDelete={() => {
                          if (item.license_plate.alert_profile) {
                            handleLicensePlateProfileDelete(
                              item.license_plate.alert_profile.id
                            );
                          }
                        }}
                      />
                      <LicensePlateOfInterestTableRowCell
                        alertProfile={item.license_plate.alert_profile}
                        notificationGroups={notificationGroups}
                      />
                    </TableRow>
                  )
              )}
            </TableBody>
          )}
        </Table>
      </TableContainer>
    </Stack>
  );
}
