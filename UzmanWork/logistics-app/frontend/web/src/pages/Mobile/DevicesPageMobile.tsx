import { Button, Stack, Typography } from "@mui/material";
import { DeviceHeaderMobile } from "components/DeviceHeaderMobile";
import { CamerasList } from "components/devices/CamerasList";
import { SearchInput } from "components/devices/SearchInput";
import {
  CameraFilters,
  CameraStatusOption,
  DEFAULT_CAMERA_FILTERS,
  REFETCH_INTERVAL,
} from "components/devices/utils";
import { BottomNavBar } from "components/mobile_footer/BottomNavBar";
import { useMemo, useState } from "react";
import { useSearchParams } from "utils/search_params";
import { matchAtLeastOne } from "utils/search_filter";
import { mapVendor } from "utils/camera_vendors";
import { isDefined, useCamerasList } from "coram-common-utils";
import Grid from "@mui/material/Unstable_Grid2";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

export enum DevicesMobileSubTab {
  All = "All",
  Online = "Online",
  Offline = "Offline",
  Disabled = "Disabled",
}

export function DevicesPageMobile() {
  const [selectedSubTab, setSelectedSubTab] = useState<DevicesMobileSubTab>(
    DevicesMobileSubTab.All
  );

  const navigate = useNavigate();

  // params for retaining search value,
  const { searchParams, setSearchParams } = useSearchParams();

  // Filters for the Cameras tab. If we have a search query in the URL, use it.
  const [cameraFilters, setCameraFilters] = useState<CameraFilters>({
    ...DEFAULT_CAMERA_FILTERS,
    searchQuery: searchParams.get("search") || "",
  });

  const { data: streams, refetch: refetchStreams } = useCamerasList({
    excludeDisabled: false,
    refetchInterval: REFETCH_INTERVAL,
  });

  function onSubTabChange(subTab: DevicesMobileSubTab) {
    switch (subTab) {
      case DevicesMobileSubTab.All:
        setCameraFilters(DEFAULT_CAMERA_FILTERS);
        return;
      case DevicesMobileSubTab.Online:
        setCameraFilters({
          ...DEFAULT_CAMERA_FILTERS,
          cameraStatus: CameraStatusOption.Online,
        });
        return;
      case DevicesMobileSubTab.Offline:
        setCameraFilters({
          ...DEFAULT_CAMERA_FILTERS,
          cameraStatus: CameraStatusOption.Offline,
        });
        return;
      case DevicesMobileSubTab.Disabled:
        setCameraFilters({
          ...DEFAULT_CAMERA_FILTERS,
          cameraStatus: CameraStatusOption.Disabled,
        });
        return;
      default:
        setCameraFilters(DEFAULT_CAMERA_FILTERS);
        return;
    }
  }

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
    <Stack gap={1} pt={2} width="100%">
      <DeviceHeaderMobile
        streams={streams}
        selectedTab={selectedSubTab as DevicesMobileSubTab}
        setSelectedTab={(subTab: DevicesMobileSubTab) => {
          setSelectedSubTab(subTab);
          onSubTabChange(subTab);
        }}
      />
      <Grid container px={2} py={1} spacing={2}>
        <Grid xs={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon fontSize="small" />}
            sx={{
              color: "common.black",
              borderColor: "common.black",
              borderRadius: "4px",
              px: "0px",
            }}
            onClick={() => navigate("/register-cameras")}
          >
            <Typography>Add Camera</Typography>
          </Button>
        </Grid>
        <Grid xs={6}>
          <SearchInput
            placeHolder="Search"
            value={cameraFilters.searchQuery}
            onChange={(value) => {
              setSearchParams({
                search: `${value}`,
              });
              setCameraFilters((prev) => ({
                ...prev,
                searchQuery: value,
              }));
            }}
            sx={{ maxHeight: "40px" }}
          />
        </Grid>
      </Grid>
      <CamerasList data={filterStreams} refetch={refetchStreams} />
      <BottomNavBar />
    </Stack>
  );
}
