import { FaceAlertResponse, FaceAlertService } from "coram-common-utils";
import { useContext, useState } from "react";
import {
  PaginationData,
  ITEMS_PER_PAGE,
  Paginator,
} from "components/devices/PaginationUtils";
import { Box, CircularProgress, Stack } from "@mui/material";
import { NotificationContext } from "contexts/notification_context";
import { Duration } from "luxon";
import {
  SearchCbParams,
  SearchFilter,
} from "components/common/search_filter/SearchFilter";
import { handleSearchChange } from "components/common/search_filter/utils";
import { PersonOfInterestTable } from "./components/PersonOfInterestTable";

const INITIAL_PAGINATION_DATA = {
  page: 0,
  itemsPerPage: ITEMS_PER_PAGE[0],
};

interface PersonOfInterestTabProps {
  setSelectedFaceProfileId: (faceId: number | null) => void;
}
export function PersonOfInterestTab({
  setSelectedFaceProfileId,
}: PersonOfInterestTabProps) {
  const [faceAlerts, setFaceAlerts] = useState<FaceAlertResponse[]>();
  const [paginationData, setPaginationData] = useState<PaginationData>(
    INITIAL_PAGINATION_DATA
  );
  const showPagination = faceAlerts && Object.keys(faceAlerts).length > 0;
  const { setNotificationData } = useContext(NotificationContext);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchFaceAlerts(params: SearchCbParams) {
    const FaceAlertResponses =
      await FaceAlertService.getLatestPersonOfInterestAlertOccurrences({
        start_time: params.startTime,
        end_time: params.endTime,
        mac_addresses: params.macAddresses,
        location_ids: params.locationIds,
      });
    setFaceAlerts(FaceAlertResponses);
    setPaginationData((prev) => ({ ...prev, page: 0 }));
  }

  return (
    <Stack px={1} gap={2}>
      <SearchFilter
        handleFilterUpdate={async (params: SearchCbParams) => {
          return await handleSearchChange(
            params,
            fetchFaceAlerts,
            setLoading,
            setNotificationData
          );
        }}
        maxDurationBetweenSearchStartAndEndTime={Duration.fromObject({
          days: 20,
        })}
      />
      {loading ? (
        <Box p={12} justifyContent="center" alignItems="center" display="flex">
          <CircularProgress size={45} color="secondary" />
        </Box>
      ) : (
        <>
          {faceAlerts && (
            <PersonOfInterestTable
              faceAlerts={faceAlerts}
              paginationData={paginationData}
              setSelectedFaceProfileId={setSelectedFaceProfileId}
            />
          )}
          {showPagination && (
            <Paginator
              numItems={faceAlerts.length}
              paginationData={paginationData}
              setItemsPerPage={(itemsPerPage) =>
                setPaginationData({
                  page: 0,
                  itemsPerPage,
                })
              }
              setPage={(page) =>
                setPaginationData((prev) => ({ ...prev, page: page }))
              }
            />
          )}
        </>
      )}
    </Stack>
  );
}
