import CustomTabView from "components/analytics/CustomTabView";
import { TAB_STYLE, TabItem } from "pages/analytics/utils";
import { DialogContent, Modal } from "@mui/material";
import { useNvrs } from "utils/globals";
import { CameraResponse, DevicesService } from "coram-common-utils";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import { DeviceRegistrationPopup } from "components/devices/DeviceRegistrationPopup";
import {
  NvrFilters,
  DEFAULT_NVR_FILTERS,
  REFETCH_INTERVAL,
  getNvrDataCsv,
  getNvrDataCsvFileName,
} from "components/devices/utils";
import { useSearchParams } from "utils/search_params";
import { QueryObserverResult } from "react-query";
import { useState } from "react";
import { TabsRightViewControls } from "components/devices/TabsRightViewControls";
import { NvrsSubTab, NvrsSubTabOption } from "components/devices/NvrsSubTab";
import { useIsRegularUser } from "components/layout/RoleGuards";

export function AppliancesTab({
  streams,
  refetchStreams,
}: {
  streams: CameraResponse[];
  refetchStreams: () => Promise<QueryObserverResult<CameraResponse[]>>;
}) {
  const isRegularUser = useIsRegularUser();

  const [deviceRegistrationOpen, setDeviceRegistrationOpen] =
    useState<boolean>(false);

  const [selectedSubTab, setSelectedSubTab] = useState<NvrsSubTabOption>(
    NvrsSubTabOption.All
  );

  // params for retaining search value,
  const { searchParams, setSearchParams } = useSearchParams();

  // Filters for the Nvrs. If we have a search query in the URL, use it.
  const [nvrFilters, setNvrFilters] = useState<NvrFilters>({
    ...DEFAULT_NVR_FILTERS,
    searchQuery: searchParams.get("search") || "",
  });

  // Nvrs the user has access to
  const {
    data: nvrs,
    refetch: refetchNVRs,
    isFetched: nvrsFetched,
  } = useNvrs({ refetchInterval: REFETCH_INTERVAL });

  const totalNvrsLength = nvrs.length;
  const onlineNvrsLength = nvrs.filter((nvr) => nvr.is_online).length;
  const offlineNvrsLength = nvrs.filter((nvr) => !nvr.is_online).length;
  const nvrsIsEmpty = nvrsFetched && !nvrs.length;

  function onSubTabChange(subTab: NvrsSubTabOption) {
    switch (subTab) {
      case NvrsSubTabOption.All:
        setNvrFilters(DEFAULT_NVR_FILTERS);
        return;
      case NvrsSubTabOption.Online:
        setNvrFilters({
          ...DEFAULT_NVR_FILTERS,
          applianceOnline: true,
        });
        return;
      case NvrsSubTabOption.Offline:
        setNvrFilters({
          ...DEFAULT_NVR_FILTERS,
          applianceOnline: false,
        });
        return;
      default:
        setNvrFilters(DEFAULT_NVR_FILTERS);
        return;
    }
  }

  function resetFilters() {
    setNvrFilters(DEFAULT_NVR_FILTERS);
    setSelectedSubTab(NvrsSubTabOption.All);
    setSearchParams({});
  }

  const tabData: TabItem[] = [
    {
      label: `All (${totalNvrsLength})`,
      value: NvrsSubTabOption.All,
      component: (
        <NvrsSubTab
          nvrs={nvrs}
          streams={streams}
          selectedSubTab={selectedSubTab as NvrsSubTabOption}
          nvrFilters={nvrFilters}
          refetchNVRs={refetchNVRs}
          resetFilters={resetFilters}
        />
      ),
    },
    {
      label: `Online (${onlineNvrsLength})`,
      value: NvrsSubTabOption.Online,
      component: (
        <NvrsSubTab
          nvrs={nvrs}
          streams={streams}
          selectedSubTab={selectedSubTab as NvrsSubTabOption}
          nvrFilters={nvrFilters}
          refetchNVRs={refetchNVRs}
          resetFilters={resetFilters}
        />
      ),
    },
    {
      label: `Offline (${offlineNvrsLength})`,
      value: NvrsSubTabOption.Offline,
      component: (
        <NvrsSubTab
          nvrs={nvrs}
          streams={streams}
          selectedSubTab={selectedSubTab as NvrsSubTabOption}
          nvrFilters={nvrFilters}
          refetchNVRs={refetchNVRs}
          resetFilters={resetFilters}
        />
      ),
    },
  ];

  return nvrsIsEmpty ? (
    <DialogContent>
      <AbsolutelyCentered>
        <DeviceRegistrationPopup
          setRegistrationOpen={setDeviceRegistrationOpen}
          onRegistrationSuccess={() => {
            refetchNVRs();
            refetchStreams();
          }}
        />
      </AbsolutelyCentered>
    </DialogContent>
  ) : (
    <>
      <CustomTabView
        tabData={tabData}
        selectedTab={selectedSubTab as NvrsSubTabOption}
        setSelectedTab={(tab) => {
          setSelectedSubTab(tab);
          onSubTabChange(tab as NvrsSubTabOption);
        }}
        tabStyle={TAB_STYLE}
        rightViewControls={
          <TabsRightViewControls
            addButtonTitle="Add New Device"
            onAddButtonClick={() => setDeviceRegistrationOpen(true)}
            searchInput={nvrFilters.searchQuery}
            onSearchChange={(value) => {
              setSearchParams({
                search: `${value}`,
              });
              setNvrFilters((prev) => ({
                ...prev,
                searchQuery: value,
              }));
            }}
            exportConfig={
              isRegularUser
                ? {
                    exportFn: async () => {
                      await DevicesService.requestNvrsExport({
                        format: "csv",
                      });
                      return getNvrDataCsv(nvrs);
                    },
                    exportName: getNvrDataCsvFileName,
                    exportFormat: "csv",
                    mimeType: "text/csv",
                  }
                : undefined
            }
          />
        }
      />
      <Modal
        open={deviceRegistrationOpen}
        onClose={() => setDeviceRegistrationOpen(false)}
      >
        <DialogContent>
          <AbsolutelyCentered>
            <DeviceRegistrationPopup
              setRegistrationOpen={setDeviceRegistrationOpen}
              onRegistrationSuccess={() => {
                refetchNVRs();
                refetchStreams();
              }}
            />
          </AbsolutelyCentered>
        </DialogContent>
      </Modal>
    </>
  );
}
