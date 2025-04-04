import React from "react";
import { Tab, Tabs } from "@mui/material";
import { CameraResponse } from "coram-common-utils";
import { DevicesMobileSubTab } from "pages/Mobile/DevicesPageMobile";

const tabStyle = {
  fontSize: "14px",
  fontWeight: 600,
  padding: 0,
  textWrap: "nowrap",
  "&.Mui-selected": {
    color: "secondary.main",
  },
};

export function DeviceHeaderMobile({
  streams,
  selectedTab,
  setSelectedTab,
}: {
  streams: CameraResponse[];
  selectedTab: DevicesMobileSubTab;
  setSelectedTab: (tab: DevicesMobileSubTab) => void;
}) {
  const totalCameras = streams.length;
  const activeCameras = streams.filter(
    (stream) => stream.camera.is_online && stream.camera.is_enabled
  ).length;
  const offlineCameras = streams.filter(
    (stream) => !stream.camera.is_online && stream.camera.is_enabled
  ).length;
  const disabledCameras = streams.filter(
    (stream) => !stream.camera.is_online && !stream.camera.is_enabled
  ).length;

  return (
    <Tabs
      value={selectedTab}
      variant="fullWidth"
      onChange={(ev: React.SyntheticEvent, val) => setSelectedTab(val)}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        color: "secondary.main",
      }}
      TabIndicatorProps={{
        sx: {
          backgroundColor: "secondary.main",
        },
      }}
    >
      <Tab
        label={`All (${totalCameras})`}
        value={DevicesMobileSubTab.All}
        sx={{ ...tabStyle }}
      />
      <Tab
        label={`Active (${activeCameras})`}
        value={DevicesMobileSubTab.Online}
        sx={{ ...tabStyle }}
      />
      <Tab
        label={`Offline (${offlineCameras})`}
        value={DevicesMobileSubTab.Offline}
        sx={{ ...tabStyle }}
      />
      <Tab
        label={`Disabled (${disabledCameras})`}
        value={DevicesMobileSubTab.Disabled}
        sx={{ ...tabStyle }}
      />
    </Tabs>
  );
}
