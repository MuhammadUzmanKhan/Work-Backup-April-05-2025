import { StyledSelect } from "components/styled_components/StyledSelect";
import { Box, Stack, Typography } from "@mui/material";
import { SearchInput } from "components/devices/SearchInput";
import {
  CameraGroupWithLocations,
  CameraResponse,
  Location,
  isDefined,
} from "coram-common-utils";
import { useMemo, useState } from "react";
import { useMostRecentThumbnails } from "utils/globals";
import {
  CameraMenuItem,
  SelectCameraGroupFilter,
  SelectLocationFilter,
} from "./components";
import { cameraMatchesFilters } from "./utils";
import Grid from "@mui/material/Unstable_Grid2";

export interface CamerasSelectorProps {
  selectedCamerasMacAddresses: string[];
  setSelectedCamerasMacAddresses: (macAddresses: string[]) => Promise<void>;
  favouriteCameraMacAddress?: string;
  setFavouriteCameraMacAddress?: (
    macAddress: string | undefined
  ) => Promise<void>;
  disabled?: boolean;
  availableCameras: CameraResponse[];
  cameraGroups: CameraGroupWithLocations[];
  locations: Location[];
}

export function CamerasSelector({
  selectedCamerasMacAddresses,
  setSelectedCamerasMacAddresses,
  favouriteCameraMacAddress,
  setFavouriteCameraMacAddress,
  availableCameras,
  cameraGroups,
  disabled = false,
  locations,
}: CamerasSelectorProps) {
  const [locationFilter, setLocationFilter] = useState<number>();
  const [groupFilter, setGroupFilter] = useState<number>();
  const [camerasSearchQuery, setCamerasSearchQuery] = useState<string>("");

  const filteredCameras = useMemo(() => {
    if (
      camerasSearchQuery === "" &&
      !isDefined(groupFilter) &&
      !isDefined(locationFilter)
    ) {
      return availableCameras;
    }

    const searchQuery = camerasSearchQuery.toLowerCase();

    return availableCameras.filter(
      (camera) =>
        cameraMatchesFilters(
          camera,
          searchQuery,
          locationFilter,
          groupFilter
        ) || selectedCamerasMacAddresses.includes(camera.camera.mac_address)
    );
  }, [
    availableCameras,
    selectedCamerasMacAddresses,
    camerasSearchQuery,
    locationFilter,
    groupFilter,
  ]);

  const filteredCameraGroups = useMemo(
    () =>
      cameraGroups.filter(
        (group) =>
          !isDefined(locationFilter) ||
          group.location_ids.includes(locationFilter)
      ),
    [cameraGroups, locationFilter]
  );

  // Ensure that favorite cameras are always first in the array, so in the Select user sees them first
  const sortedSelectedCamerasMacAddresses = selectedCamerasMacAddresses.sort(
    (a) => (a === favouriteCameraMacAddress ? -1 : 1)
  );

  const filteredCamerasMacAddresses = useMemo(
    () => filteredCameras.map((camera) => camera.camera.mac_address),
    [filteredCameras]
  );

  const {
    data: mostRecentThumbnails,
    isFetching: isFetchingMostRecentThumbnails,
  } = useMostRecentThumbnails({
    camera_mac_addresses: filteredCamerasMacAddresses,
  });

  async function handleCameraToggle(camera: CameraResponse) {
    const macAddress = camera.camera.mac_address;
    const isCameraCurrentlySelected =
      selectedCamerasMacAddresses.includes(macAddress);

    if (isCameraCurrentlySelected) {
      await setSelectedCamerasMacAddresses(
        selectedCamerasMacAddresses.filter((mac) => mac !== macAddress)
      );
    } else {
      await setSelectedCamerasMacAddresses([
        ...selectedCamerasMacAddresses,
        macAddress,
      ]);
    }
  }

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  return (
    <StyledSelect
      fullWidth
      value={sortedSelectedCamerasMacAddresses}
      displayEmpty
      multiple={true}
      disabled={disabled}
      open={isSelectOpen}
      onOpen={() => setIsSelectOpen(true)}
      onClose={() => setIsSelectOpen(false)}
      renderValue={(selected) => {
        const selectedArray = selected as string[];
        if (selectedArray.length === 0) {
          return "Click to assign Cameras";
        }
        return sortedSelectedCamerasMacAddresses
          .map((macAddress) =>
            availableCameras.find((c) => c.camera.mac_address === macAddress)
          )
          .filter(isDefined)
          .map((camera) => camera.camera.name)
          .join(", ");
      }}
      MenuProps={{ sx: { width: "200px" } }}
    >
      <Grid container spacing={1} p={2} onKeyDown={(e) => e.stopPropagation()}>
        <Grid xs={4}>
          <SelectLocationFilter
            locationFilter={locationFilter}
            onLocationFilterChange={setLocationFilter}
            locations={locations}
          />
        </Grid>
        <Grid xs={4}>
          <SelectCameraGroupFilter
            groupFilter={groupFilter}
            onCameraGroupFilterChange={setGroupFilter}
            groups={filteredCameraGroups}
          />
        </Grid>
        <Grid xs={4}>
          <SearchInput
            placeHolder="Search"
            value={camerasSearchQuery}
            onChange={(value) => setCamerasSearchQuery(value)}
          />
        </Grid>
      </Grid>
      {filteredCameras.length === 0 ? (
        <Stack p={2} direction="row" justifyContent="center" m="10px 0">
          <Typography variant="body2">No Cameras found</Typography>
        </Stack>
      ) : (
        <Box maxHeight="40vh" sx={{ overflowY: "auto" }}>
          {filteredCameras.map((camera) => (
            <CameraMenuItem
              key={camera.camera.mac_address}
              cameraName={camera.camera.name}
              cameraMacAddress={camera.camera.mac_address}
              isSelected={selectedCamerasMacAddresses.includes(
                camera.camera.mac_address
              )}
              isFavorite={
                camera.camera.mac_address === favouriteCameraMacAddress
              }
              thumbnail={mostRecentThumbnails.get(camera.camera.mac_address)}
              isFetchingThumbnail={isFetchingMostRecentThumbnails}
              onCameraToggle={() => handleCameraToggle(camera)}
              onSetCameraFavorite={
                isDefined(setFavouriteCameraMacAddress)
                  ? () =>
                      setFavouriteCameraMacAddress(camera.camera.mac_address)
                  : undefined
              }
            />
          ))}
        </Box>
      )}
    </StyledSelect>
  );
}
