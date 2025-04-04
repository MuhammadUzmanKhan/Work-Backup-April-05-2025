import { Stack } from "@mui/material";
import { CamerasTable } from "./CamerasTable";
import { ITEMS_PER_PAGE, PaginationData, Paginator } from "./PaginationUtils";
import { useMemo, useState } from "react";
import { useSearchParams } from "utils/search_params";
import {
  getCameraFullInfoInStorage,
  setCameraFullInfoInStorage,
} from "utils/local_storage";
import { matchAtLeastOne } from "utils/search_filter";
import { mapVendor } from "utils/camera_vendors";
import { CameraResponse, isDefined } from "coram-common-utils";
import { CameraFilters, CameraStatusOption, TOTAL_TOP_HEIGHT } from "./utils";
import { QueryObserverResult } from "react-query";
import { SearchSummary } from "./SearchSummary";
import { updateSearchParams } from "common/utils";

const COMPRESSED_ITEMS_PER_PAGE = [25, 50, 100];

export enum CamerasSubTabOption {
  All = "All",
  Online = "Online",
  Offline = "Offline",
  Disabled = "Disabled",
}

interface CamerasSubTabProps {
  streams: CameraResponse[];
  refetchStreams: () => Promise<QueryObserverResult<CameraResponse[]>>;
  resetFilters: VoidFunction;
  cameraFilters: CameraFilters;
  paginationData: PaginationData;
  setPaginationData: React.Dispatch<React.SetStateAction<PaginationData>>;
}

export function CamerasSubTab({
  streams,
  resetFilters,
  refetchStreams,
  cameraFilters,
  paginationData,
  setPaginationData,
}: CamerasSubTabProps) {
  // Whether to show the full info of the camera or not
  const [showCameraFullInfo, setShowCameraFullInfo] = useState(
    getCameraFullInfoInStorage()
  );
  // params for retaining search value, pagination & items per page
  const { setSearchParams } = useSearchParams();

  const showSearchSummary = cameraFilters.searchQuery !== "";

  // Filter streams based on the cameras filters
  const filterStreams = useMemo(() => {
    return streams.filter((stream) => {
      let include = true;
      if (cameraFilters.searchQuery !== "") {
        include &&= matchAtLeastOne(cameraFilters.searchQuery, [
          stream.camera.name,
          stream.camera.mac_address,
          stream.camera.nvr_uuid,
          stream.camera.ip,
          stream.location,
          stream.group_name,
          mapVendor(stream.camera.vendor),
        ]);
      }

      // Camera status matching
      if (isDefined(cameraFilters.cameraStatus)) {
        switch (cameraFilters.cameraStatus) {
          case CameraStatusOption.Online:
            include &&= stream.camera.is_online;
            break;
          case CameraStatusOption.Offline:
            include &&= stream.camera.is_enabled && !stream.camera.is_online;
            break;
          case CameraStatusOption.Disabled:
            include &&= !stream.camera.is_enabled;
            break;
          default:
            break;
        }
      }
      return include;
    });
  }, [cameraFilters.cameraStatus, cameraFilters.searchQuery, streams]);

  return (
    <Stack gap={2} height={`calc(100vh - ${TOTAL_TOP_HEIGHT}px)`}>
      {showSearchSummary && (
        <SearchSummary
          totalResults={filterStreams.length}
          resetFilters={resetFilters}
        />
      )}
      <CamerasTable
        paginationData={paginationData}
        data={filterStreams}
        refetchStreams={refetchStreams}
        showFullInfo={showCameraFullInfo}
        onShowFullInfoChange={(showFullInfo: boolean) => {
          setShowCameraFullInfo(showFullInfo);
          setCameraFullInfoInStorage(showFullInfo);
          const itemsPerPage = showFullInfo
            ? ITEMS_PER_PAGE[0]
            : COMPRESSED_ITEMS_PER_PAGE[0];
          setPaginationData({
            page: 0,
            itemsPerPage,
          });
          setSearchParams((params) =>
            updateSearchParams(params, {
              page: "0",
              itemsPerPage: `${itemsPerPage}`,
            })
          );
        }}
      />
      <Paginator
        itemsPerPageOptions={
          showCameraFullInfo ? ITEMS_PER_PAGE : COMPRESSED_ITEMS_PER_PAGE
        }
        numItems={filterStreams.length}
        paginationData={paginationData}
        setItemsPerPage={(itemsPerPage) => {
          setPaginationData({
            page: 0,
            itemsPerPage,
          });
          setSearchParams((params) =>
            updateSearchParams(params, {
              page: "0",
              itemsPerPage: `${itemsPerPage}`,
            })
          );
        }}
        setPage={(page) => {
          setPaginationData((prev) => ({
            ...prev,
            page,
          }));
          setSearchParams((params) =>
            updateSearchParams(params, {
              page: `${page}`,
            })
          );
        }}
      />
    </Stack>
  );
}
