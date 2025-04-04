import { StyledSelect } from "components/styled_components/StyledSelect";
import {
  Box,
  Button,
  Stack,
  styled,
  TableCell,
  Typography,
} from "@mui/material";
import { SearchInput } from "components/devices/SearchInput";
import {
  AccessControlService,
  CameraGroupWithLocations,
  CameraResponse,
  Location,
  isDefined,
} from "coram-common-utils";
import { useContext, useMemo, useState } from "react";
import { useMostRecentThumbnails } from "utils/globals";
import { CameraMenuItem } from "./CameraMenuItem";
import { NotificationContext } from "contexts/notification_context";
import { QueryObserverResult } from "react-query";
import { SelectCameraGroupFilter } from "./SelectCameraGroupFilter";
import { AccessPointResponse } from "features/accessControl/types";

export interface SelectCamerasTableCellProps {
  accessPoint: AccessPointResponse;
  cameras: CameraResponse[];
  location: Location | undefined;
  cameraGroups: CameraGroupWithLocations[];
  refetchAccessPoints: () => Promise<
    QueryObserverResult<AccessPointResponse[]>
  >;
}

export function SelectCamerasTableCell({
  cameras,
  cameraGroups,
  location,
  accessPoint,
  refetchAccessPoints,
}: SelectCamerasTableCellProps) {
  const { setNotificationData } = useContext(NotificationContext);

  const [groupFilter, setGroupFilter] = useState<number[]>([]);
  const [camerasSearchQuery, setCamerasSearchQuery] = useState<string>("");

  const filteredCameras = useMemo(() => {
    if (
      camerasSearchQuery === "" &&
      groupFilter.length === 0 &&
      !isDefined(location)
    ) {
      return cameras;
    }

    const searchQuery = camerasSearchQuery.toLowerCase();

    return cameras.filter((camera) =>
      isCameraMatchingFilters(camera, searchQuery, groupFilter, location)
    );
  }, [cameras, camerasSearchQuery, groupFilter, location]);

  // Ensure that favorite cameras are always first in the array, so in the Select user sees them first
  const selectedCamerasMacAddresses = accessPoint.cameras
    .sort((a, b) => {
      if (a.is_favorite === b.is_favorite) {
        return 0;
      }
      return a.is_favorite ? -1 : 1;
    })
    .map((c) => c.mac_address);

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
    const isCameraSelected = selectedCamerasMacAddresses.includes(
      camera.camera.mac_address
    );

    try {
      const requestBody = {
        access_point_id: accessPoint.id,
        vendor: accessPoint.vendor,
        camera_mac_address: camera.camera.mac_address,
      };
      isCameraSelected
        ? await AccessControlService.unassignCamera(requestBody)
        : await AccessControlService.assignCamera(requestBody);
    } catch (e) {
      setNotificationData({
        message: "Failed to update assigned cameras.",
        severity: "error",
      });
      console.error(e);
    } finally {
      await refetchAccessPoints();
    }
  }

  async function handleSetCameraFavorite(camera: CameraResponse) {
    try {
      await AccessControlService.setFavoriteCamera({
        access_point_id: accessPoint.id,
        vendor: accessPoint.vendor,
        camera_mac_address: camera.camera.mac_address,
      });
    } catch (e) {
      setNotificationData({
        message: "Failed to set the camera as favorite.",
        severity: "error",
      });
      console.error(e);
    } finally {
      await refetchAccessPoints();
    }
  }

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  return (
    <TableCell>
      <StyledSelect
        fullWidth
        value={selectedCamerasMacAddresses}
        displayEmpty
        multiple={true}
        disabled={!isDefined(location)}
        open={isSelectOpen}
        onOpen={() => setIsSelectOpen(true)}
        onClose={() => setIsSelectOpen(false)}
        renderValue={(selected) => {
          const selectedArray = selected as string[];
          if (!isDefined(location)) {
            return "First, select a Location to assign Cameras.";
          } else if (selectedArray.length === 0) {
            return "Click to assign Cameras";
          }

          return selectedCamerasMacAddresses
            .map((macAddress) =>
              cameras.find((c) => c.camera.mac_address === macAddress)
            )
            .filter(isDefined)
            .map((camera) => camera.camera.name)
            .join(", ");
        }}
      >
        <MenuContainer
          direction="row"
          gap={1}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <SelectCameraGroupFilter
            groupFilter={groupFilter}
            onCameraGroupFilterChange={setGroupFilter}
            groups={cameraGroups}
            location={location}
          />
          <SearchInput
            placeHolder="Search"
            value={camerasSearchQuery}
            onChange={(value) => setCamerasSearchQuery(value)}
            sx={{
              width: "50%",
            }}
          />
        </MenuContainer>
        {filteredCameras.length === 0 ? (
          <MenuContainer
            direction="row"
            justifyContent="center"
            margin="10px 0"
          >
            <Typography variant="body2">No Cameras found</Typography>
          </MenuContainer>
        ) : (
          <Box sx={{ maxHeight: "40vh", overflowY: "auto" }}>
            {filteredCameras.map((camera) => (
              <CameraMenuItem
                key={camera.camera.mac_address}
                cameraName={camera.camera.name}
                cameraMacAddress={camera.camera.mac_address}
                isSelected={selectedCamerasMacAddresses.includes(
                  camera.camera.mac_address
                )}
                isFavorite={accessPoint.cameras.some(
                  (cameraInfo) =>
                    cameraInfo.is_favorite &&
                    cameraInfo.mac_address === camera.camera.mac_address
                )}
                thumbnail={mostRecentThumbnails.get(camera.camera.mac_address)}
                isFetchingThumbnail={isFetchingMostRecentThumbnails}
                onCameraToggle={() => handleCameraToggle(camera)}
                onSetCameraFavorite={() => handleSetCameraFavorite(camera)}
              />
            ))}
          </Box>
        )}
        <MenuContainer>
          <Button
            variant="contained"
            fullWidth
            color="secondary"
            onClick={() => setIsSelectOpen(false)}
          >
            Done
          </Button>
        </MenuContainer>
      </StyledSelect>
    </TableCell>
  );
}

const MenuContainer = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(1, 2),
}));

function isCameraMatchingFilters(
  camera: CameraResponse,
  searchQuery: string,
  groupFilter: number[],
  locationFilter: Location | undefined
) {
  const isGroupFiltered =
    groupFilter.length === 0 ||
    (camera.camera.camera_group_id &&
      groupFilter.includes(camera.camera.camera_group_id));

  const isInSearch =
    searchQuery === "" ||
    camera.camera.name.toLowerCase().includes(searchQuery) ||
    camera.camera.mac_address.toLowerCase().includes(searchQuery) ||
    camera.camera.ip.toLowerCase().includes(searchQuery);

  const isLocationFiltered =
    !isDefined(locationFilter) || camera.location_id === locationFilter.id;

  return isGroupFiltered && isInSearch && isLocationFiltered;
}
