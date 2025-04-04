import { CameraResponse } from "coram-common-utils";
import { Stack } from "@mui/material";
import { useState } from "react";
import {
  CameraSettingsDrawerTab,
  CameraSettingsDrawerTabs,
  CameraSettingsTab,
  HealthTab,
  RecentErrorsTab,
} from "./components";
import { QueryObserverResult } from "react-query";
import { DateTime } from "luxon";

interface CameraSettingsDrawerBodyProps {
  camera: CameraResponse;
  refetchCameras: () => Promise<QueryObserverResult<CameraResponse[]>>;
}

export function CameraSettingsDrawerBody({
  camera,
  refetchCameras,
}: CameraSettingsDrawerBodyProps) {
  const [selectedTab, setSelectedTab] =
    useState<CameraSettingsDrawerTab>("settings");

  return (
    <Stack width="100%" gap={2}>
      <CameraSettingsDrawerTabs
        activeTab={selectedTab}
        onChangeTab={(tab) => setSelectedTab(tab)}
      />
      {selectedTab === "settings" && (
        <CameraSettingsTab camera={camera} refetchCameras={refetchCameras} />
      )}
      {selectedTab === "health" && (
        <HealthTab
          cameraId={camera.camera.id}
          cameraMacAddress={camera.camera.mac_address}
          isOnline={camera.camera.is_online}
          lastSeenTime={
            camera.camera.last_seen_time
              ? DateTime.fromISO(camera.camera.last_seen_time)
              : DateTime.now()
          }
        />
      )}
      {selectedTab === "errors" && (
        <RecentErrorsTab cameraMacAddress={camera.camera.mac_address} />
      )}
    </Stack>
  );
}
