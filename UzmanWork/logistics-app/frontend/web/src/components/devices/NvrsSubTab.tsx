import { Stack } from "@mui/material";
import { NVRTable } from "./NVRTable";
import { useMemo, useState } from "react";
import {
  getInitialNvrsSubTabsData,
  NvrFilters,
  TOTAL_TOP_HEIGHT,
} from "./utils";
import { useSearchParams } from "utils/search_params";
import { CameraResponse, NVRResponse, isDefined } from "coram-common-utils";
import { QueryObserverResult } from "react-query";
import { ITEMS_PER_PAGE, PaginationData, Paginator } from "./PaginationUtils";
import { SearchSummary } from "./SearchSummary";

export enum NvrsSubTabOption {
  All = "All",
  Online = "Online",
  Offline = "Offline",
}

type NvrsSubTabsPaginationData = {
  [Key in NvrsSubTabOption]: PaginationData;
};

interface NvrsSubTabProps {
  nvrs: NVRResponse[];
  streams: CameraResponse[];
  selectedSubTab: NvrsSubTabOption;
  refetchNVRs: () => Promise<QueryObserverResult<NVRResponse[], unknown>>;
  resetFilters: VoidFunction;
  nvrFilters: NvrFilters;
}

export function NvrsSubTab({
  nvrs,
  streams,
  selectedSubTab,
  refetchNVRs,
  resetFilters,
  nvrFilters,
}: NvrsSubTabProps) {
  // params for retaining pagination number,
  const { searchParams, setSearchParams } = useSearchParams();

  // Pagination data
  const [paginationData, setPaginationData] =
    useState<NvrsSubTabsPaginationData>(getInitialNvrsSubTabsData());

  // Filter appliances based on the nvrs filters
  const filterAppliances = useMemo(() => {
    return nvrs.filter((nvr) => {
      let include = true;
      if (nvrFilters.searchQuery !== "") {
        include &&=
          nvr.uuid.toLowerCase().includes(nvrFilters.searchQuery) ||
          (nvr.location_name?.toLowerCase().includes(nvrFilters.searchQuery) ??
            false);
      }
      if (isDefined(nvrFilters.applianceOnline)) {
        include &&= nvr.is_online === nvrFilters.applianceOnline;
      }
      return include;
    });
  }, [nvrs, nvrFilters.applianceOnline, nvrFilters.searchQuery]);

  const showSearchSummary = nvrFilters.searchQuery !== "";

  return (
    <Stack gap={2} height={`calc(100vh - ${TOTAL_TOP_HEIGHT}px)`}>
      {showSearchSummary && (
        <SearchSummary
          totalResults={filterAppliances.length}
          resetFilters={resetFilters}
        />
      )}
      <NVRTable
        paginationData={paginationData[selectedSubTab]}
        nvrs={filterAppliances}
        cameras={streams}
        refetchNvrs={refetchNVRs}
      />
      <Paginator
        itemsPerPageOptions={ITEMS_PER_PAGE}
        numItems={filterAppliances.length}
        paginationData={paginationData[selectedSubTab]}
        setItemsPerPage={(itemsPerPage) =>
          setPaginationData((prev) => ({
            ...prev,
            [selectedSubTab]: { page: 0, itemsPerPage },
          }))
        }
        setPage={(page) => {
          setPaginationData((prev) => ({
            ...prev,
            [selectedSubTab]: {
              ...prev[selectedSubTab],
              page,
            },
          }));
          setSearchParams({
            ...searchParams,
            page: `${page}`,
          });
        }}
      />
    </Stack>
  );
}
