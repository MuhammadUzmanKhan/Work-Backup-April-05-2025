import CustomTabView from "components/analytics/CustomTabView";
import { useState } from "react";
import {
  CameraFilters,
  CameraStatusOption,
  DEFAULT_CAMERA_FILTERS,
  getCameraDataCsv,
  getCameraDataCsvFileName,
  getCameraStatus,
} from "components/devices/utils";
import { TAB_STYLE, TabItem } from "pages/analytics/utils";
import { useSearchParams } from "utils/search_params";
import { CameraResponse, DevicesService } from "coram-common-utils";
import { QueryObserverResult } from "react-query";
import { TabsRightViewControls } from "components/devices/TabsRightViewControls";
import { CameraRegistrationModal } from "features/camera_registration";
import { useIsRegularUser } from "components/layout/RoleGuards";
import {
  CamerasSubTab,
  CamerasSubTabOption,
} from "components/devices/CamerasSubTab";
import { updateSearchParams } from "common/utils";
import {
  ITEMS_PER_PAGE,
  PaginationData,
} from "components/devices/PaginationUtils";

interface CamerasTabProps {
  streams: CameraResponse[];
  refetchStreams: () => Promise<QueryObserverResult<CameraResponse[]>>;
}

export function CamerasTab({ streams, refetchStreams }: CamerasTabProps) {
  const [cameraRegistrationOpen, setCameraRegistrationOpen] =
    useState<boolean>(false);

  // params for retaining search value, pagination & items per page
  const { searchParams, setSearchParams } = useSearchParams();

  const [selectedSubTab, setSelectedSubTab] = useState<CamerasSubTabOption>(
    (searchParams.get("subTab") as CamerasSubTabOption) ??
      CamerasSubTabOption.All
  );

  // Pagination data
  const [paginationData, setPaginationData] = useState<PaginationData>({
    page: parseInt(searchParams.get("page") ?? "0"),
    itemsPerPage: parseInt(
      searchParams.get("itemsPerPage") ?? `${ITEMS_PER_PAGE}`
    ),
  });

  // Filters for the Cameras tab. If we have a search query in the URL, use it.
  const [cameraFilters, setCameraFilters] = useState<CameraFilters>({
    cameraStatus: getCameraStatus(selectedSubTab),
    searchQuery: searchParams.get("search") || "",
  });

  const totalCamerasLength = streams.length;
  const onlineCamerasLength = streams.filter(
    (stream) => stream.camera.is_online && stream.camera.is_enabled
  ).length;
  const disabledCamerasLength = streams.filter(
    (stream) => !stream.camera.is_online && !stream.camera.is_enabled
  ).length;
  const offlineCamerasLength = streams.filter(
    (stream) => !stream.camera.is_online && stream.camera.is_enabled
  ).length;

  const isRegularUser = useIsRegularUser();

  function onSubTabChange(subTab: CamerasSubTabOption) {
    setSearchParams((params) =>
      updateSearchParams(params, {
        subTab: subTab,
        page: "0",
      })
    );
    setPaginationData((prev) => ({
      ...prev,
      page: 0,
    }));

    switch (subTab) {
      case CamerasSubTabOption.All:
        setCameraFilters({
          ...DEFAULT_CAMERA_FILTERS,
          searchQuery: cameraFilters.searchQuery,
        });
        return;
      case CamerasSubTabOption.Online:
        setCameraFilters({
          ...DEFAULT_CAMERA_FILTERS,
          cameraStatus: CameraStatusOption.Online,
          searchQuery: cameraFilters.searchQuery,
        });
        return;
      case CamerasSubTabOption.Offline:
        setCameraFilters({
          ...DEFAULT_CAMERA_FILTERS,
          cameraStatus: CameraStatusOption.Offline,
          searchQuery: cameraFilters.searchQuery,
        });
        return;
      case CamerasSubTabOption.Disabled:
        setCameraFilters({
          ...DEFAULT_CAMERA_FILTERS,
          cameraStatus: CameraStatusOption.Disabled,
          searchQuery: cameraFilters.searchQuery,
        });
        return;
      default: {
        const _exhaustiveCheck: never = subTab;
        console.warn(_exhaustiveCheck);
        return;
      }
    }
  }

  function resetFilters() {
    setCameraFilters(DEFAULT_CAMERA_FILTERS);
    setSelectedSubTab(CamerasSubTabOption.All);
    setSearchParams({});
  }

  const tabData: TabItem[] = [
    {
      label: `All (${totalCamerasLength})`,
      value: CamerasSubTabOption.All,
      component: (
        <CamerasSubTab
          streams={streams}
          cameraFilters={cameraFilters}
          refetchStreams={refetchStreams}
          resetFilters={resetFilters}
          paginationData={paginationData}
          setPaginationData={setPaginationData}
        />
      ),
    },
    {
      label: `Online (${onlineCamerasLength})`,
      value: CamerasSubTabOption.Online,
      component: (
        <CamerasSubTab
          streams={streams}
          cameraFilters={cameraFilters}
          refetchStreams={refetchStreams}
          resetFilters={resetFilters}
          paginationData={paginationData}
          setPaginationData={setPaginationData}
        />
      ),
    },
    {
      label: `Offline (${offlineCamerasLength})`,
      value: CamerasSubTabOption.Offline,
      component: (
        <CamerasSubTab
          streams={streams}
          cameraFilters={cameraFilters}
          refetchStreams={refetchStreams}
          resetFilters={resetFilters}
          paginationData={paginationData}
          setPaginationData={setPaginationData}
        />
      ),
    },
    {
      label: `Disabled (${disabledCamerasLength})`,
      value: CamerasSubTabOption.Disabled,
      component: (
        <CamerasSubTab
          streams={streams}
          cameraFilters={cameraFilters}
          refetchStreams={refetchStreams}
          resetFilters={resetFilters}
          paginationData={paginationData}
          setPaginationData={setPaginationData}
        />
      ),
    },
  ];

  return (
    <>
      <CustomTabView
        tabData={tabData}
        selectedTab={selectedSubTab}
        setSelectedTab={(tab) => {
          setSelectedSubTab(tab);
          onSubTabChange(tab);
        }}
        tabStyle={TAB_STYLE}
        rightViewControls={
          <TabsRightViewControls
            addButtonTitle="Add New Camera"
            onAddButtonClick={() => setCameraRegistrationOpen(true)}
            searchInput={cameraFilters.searchQuery}
            onSearchChange={(value) => {
              setSearchParams((params) =>
                updateSearchParams(params, {
                  page: "0",
                  search: value,
                })
              );
              setCameraFilters((prev) => ({
                ...prev,
                searchQuery: value,
              }));
              setPaginationData((prev) => ({
                ...prev,
                page: 0,
              }));
            }}
            exportConfig={
              isRegularUser
                ? {
                    exportFn: async () => {
                      await DevicesService.requestCamerasExport({
                        format: "csv",
                      });
                      return getCameraDataCsv(streams);
                    },
                    exportName: getCameraDataCsvFileName,
                    exportFormat: "csv",
                    mimeType: "text/csv",
                  }
                : undefined
            }
          />
        }
      />
      <CameraRegistrationModal
        open={cameraRegistrationOpen}
        setOpen={setCameraRegistrationOpen}
        onCameraRegistrationSuccess={refetchStreams}
      />
    </>
  );
}
