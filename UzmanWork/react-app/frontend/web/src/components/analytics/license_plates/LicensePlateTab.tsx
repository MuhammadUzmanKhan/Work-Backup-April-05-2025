import {
  LicensePlateResponse,
  LicensePlateService,
  isDefined,
} from "coram-common-utils";
import {
  SearchCbParams,
  SearchFilter,
} from "../../common/search_filter/SearchFilter";
import { LicensePlateTable } from "./LicensePlateTable";
import { useContext, useState } from "react";
import {
  PaginationData,
  ITEMS_PER_PAGE,
  Paginator,
} from "components/devices/PaginationUtils";
import { Box, CircularProgress, Stack } from "@mui/material";
import { handleSearchChange } from "../../common/search_filter/utils";
import { NotificationContext } from "contexts/notification_context";
import { Duration } from "luxon";
import { useSortable } from "utils/sortable";
import { LicensePlateOfInterestTable } from "./LicensePlateOfInterestTable";

const INITIAL_PAGINATION_DATA = {
  page: 0,
  itemsPerPage: ITEMS_PER_PAGE[0],
};

export type LicensePlateTableSortKeys =
  | "plate"
  | "last_seen"
  | "sightings"
  | "location"
  | "camera"
  | "search";

export interface LicensePlatesTabProps {
  setSelectedLicensePlate: (selectedLicensePlate: LicensePlateResponse) => void;
  isLicensePlateOfInterest: boolean;
}

export function LicensePlatesTab({
  setSelectedLicensePlate,
  isLicensePlateOfInterest,
}: LicensePlatesTabProps) {
  const [licensePlates, setLicensePlates] =
    useState<Array<LicensePlateResponse> | null>(null);
  const [paginationData, setPaginationData] = useState<PaginationData>(
    INITIAL_PAGINATION_DATA
  );
  const showPagination = licensePlates && Object.keys(licensePlates).length > 0;
  const { setNotificationData } = useContext(NotificationContext);
  const [loading, setLoading] = useState<boolean>(false);

  const sortable = useSortable<LicensePlateTableSortKeys>("last_seen", "desc");

  // TODO (VAS-2784): Replace with useQuery
  async function fetchLicensePlates(params: SearchCbParams) {
    const licensePlateResponses = await LicensePlateService.licensePlates({
      start_time: params.startTime,
      end_time: params.endTime,
      mac_addresses: params.macAddresses,
      location_ids: params.locationIds,
      include_license_plates_of_interest_only: isLicensePlateOfInterest,
    });
    setLicensePlates(licensePlateResponses);
    setPaginationData((prev) => ({ ...prev, page: 0 }));
  }

  return (
    <Stack px={1} gap={2}>
      <SearchFilter
        handleFilterUpdate={async (params: SearchCbParams) => {
          return await handleSearchChange(
            params,
            fetchLicensePlates,
            setLoading,
            setNotificationData
          );
        }}
        maxDurationBetweenSearchStartAndEndTime={Duration.fromObject({
          months: 2,
        })}
        enableSearchBox={true}
        onSearchQueryTypeChange={() => sortable.setOrderBy("search")}
      />
      {loading ? (
        <Box p={12} justifyContent="center" alignItems="center" display="flex">
          <CircularProgress size={45} color="secondary" />
        </Box>
      ) : (
        <>
          {isDefined(licensePlates) &&
            (isLicensePlateOfInterest ? (
              <LicensePlateOfInterestTable
                licensePlates={licensePlates}
                paginationData={paginationData}
                setSelectedLicensePlate={setSelectedLicensePlate}
                sortable={sortable}
              />
            ) : (
              <LicensePlateTable
                data={licensePlates}
                paginationData={paginationData}
                setSelectedLicensePlate={setSelectedLicensePlate}
                sortable={sortable}
              />
            ))}
          {showPagination && (
            <Paginator
              numItems={licensePlates.length}
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
