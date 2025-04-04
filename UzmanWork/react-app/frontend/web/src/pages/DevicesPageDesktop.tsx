import { CircularProgress, Stack } from "@mui/material";
import { useCustomHeader } from "hooks/custom_header";
import { useCallback, useEffect, useState } from "react";
import {
  DevicesPageHeader,
  DevicesTabOption,
} from "components/devices/DevicesPageHeader";
import { AppliancesTab } from "./devices/AppliancesTab";
import { CamerasTab } from "./devices/CamerasTab";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import { REFETCH_INTERVAL } from "components/devices/utils";
import { useSearchParams } from "utils/search_params";
import { updateSearchParams } from "common/utils";
import { LocationsTab } from "./devices/LocationsTab";
import { useCamerasList } from "coram-common-utils";
import { CenteredStack } from "components/styled_components/CenteredStack";

export function DevicesPageDesktop() {
  // params for retaining tab values
  const { searchParams, setSearchParams } = useSearchParams();
  const {
    data: cameras,
    refetch: refetchCameras,
    isFetched: isCamerasFetched,
  } = useCamerasList({
    excludeDisabled: false,
    refetchInterval: REFETCH_INTERVAL,
  });
  const [selectedTab, setSelectedTab] = useState<DevicesTabOption>(
    (searchParams.get("tab") as DevicesTabOption) ?? DevicesTabOption.Cameras
  );

  useCustomHeader(
    useCallback(
      () => (
        <DevicesPageHeader
          selectedTab={selectedTab}
          setSelectedTab={(tab) => {
            setSelectedTab(tab);
            setSearchParams((params) =>
              updateSearchParams(params, {
                tab: tab,
              })
            );
          }}
        />
      ),
      [selectedTab, setSearchParams]
    )
  );

  useEffect(() => {
    // Check if the cameras are not available then set Appliances as Default tab
    if (isCamerasFetched && cameras.length === 0) {
      setSelectedTab(DevicesTabOption.Appliances);
    }
  }, [isCamerasFetched, cameras.length]);

  const getSelectedTab = (tab: DevicesTabOption) => {
    switch (tab) {
      case DevicesTabOption.Appliances:
        return (
          <AppliancesTab streams={cameras} refetchStreams={refetchCameras} />
        );
      case DevicesTabOption.Locations:
        return <LocationsTab />;
      default:
        return <CamerasTab streams={cameras} refetchStreams={refetchCameras} />;
    }
  };

  return !isCamerasFetched ? (
    <CenteredStack>
      <CircularProgress size={40} color="secondary" />
    </CenteredStack>
  ) : (
    <Stack
      minHeight={`calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`}
      bgcolor="common.white"
      gap={2}
    >
      {getSelectedTab(selectedTab)}
    </Stack>
  );
}
