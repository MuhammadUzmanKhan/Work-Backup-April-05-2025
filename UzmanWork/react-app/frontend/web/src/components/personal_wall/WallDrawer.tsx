import {
  Box,
  Button,
  Drawer,
  Stack,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  CameraResponse,
  Location,
  WallTile,
  isDefined,
} from "coram-common-utils";
import React, { useState, useMemo } from "react";
import { WallCameraSelector } from "./WallCameraSelector";
import { useMostRecentThumbnails } from "utils/globals";
import { WallDrawerItem } from "./WallDrawerItem";

interface WallDrawerProps {
  cameras: CameraResponse[];
  tiles: WallTile[];
  width: number | string;
  onSubmitClick: VoidFunction;
  onNewWallCancel?: VoidFunction;
}

const DrawerItem = styled(Box)({
  width: "100%",
  textAlign: "center",
  cursor: "pointer",
});

// Render a Drawer with the list of cameras and a button to save the wall
export function WallDrawer({
  cameras,
  tiles,
  width,
  onSubmitClick,
  onNewWallCancel,
}: WallDrawerProps) {
  const [cameraFilter, setCameraFilter] = useState("");
  const camera_mac_addresses = useMemo(
    () => cameras.map((camera) => camera.camera.mac_address),
    [cameras]
  );
  const { data: mostRecentThumbnails, isFetching } = useMostRecentThumbnails({
    camera_mac_addresses: camera_mac_addresses,
  });
  const [selectedLocation, setSelectedLocation] = React.useState<
    Location | undefined
  >(undefined);

  // Store a set of the mac addresses
  const tilesMacAddresses = useMemo(
    () =>
      new Set(
        tiles
          .filter((tile) => tile.camera_mac_address)
          .map((tile) => tile.camera_mac_address)
      ),
    [tiles]
  );

  function filterCameras(
    camera: CameraResponse,
    filter: string,
    location: Location | undefined
  ): boolean {
    const filterLowerCase = filter.toLowerCase();
    return (
      (location === undefined || camera.location_id === location.id) &&
      (camera.camera.name.toLowerCase().includes(filterLowerCase) ||
        camera.camera.ip.toLowerCase().includes(filterLowerCase) ||
        camera.camera.mac_address.toLowerCase().includes(filterLowerCase) ||
        (isDefined(camera.group_name) &&
          camera.group_name.toLowerCase().includes(filterLowerCase)) ||
        (isDefined(camera.location) &&
          camera.location.toLowerCase().includes(filterLowerCase)))
    );
  }

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: width,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar />
      <Stack
        alignItems="center"
        p={2}
        justifyContent="space-between"
        height="calc(100vh - 120px)"
        overflow="auto"
      >
        <Box>
          <WallCameraSelector
            setCameraFilter={setCameraFilter}
            onNewWallCancel={onNewWallCancel}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />
          {cameras
            .filter(
              (camera) =>
                filterCameras(camera, cameraFilter, selectedLocation) &&
                !tilesMacAddresses.has(camera.camera.mac_address)
            )
            .map((camera) => {
              return (
                <DrawerItem
                  key={camera.camera.mac_address}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "cameraMacAddress",
                      camera.camera.mac_address
                    );
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      padding: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <WallDrawerItem
                      mostRecentThumbnail={mostRecentThumbnails.get(
                        camera.camera.mac_address
                      )}
                      isFetching={isFetching}
                    ></WallDrawerItem>

                    <Typography
                      variant="body2"
                      sx={{
                        paddingLeft: "1rem",
                        textAlign: "left",
                      }}
                    >
                      {camera.camera.name}
                    </Typography>
                  </Stack>
                </DrawerItem>
              );
            })}
        </Box>
      </Stack>
      <Stack p={1}>
        <Button
          color="secondary"
          fullWidth
          variant="contained"
          onClick={onSubmitClick}
          disabled={tilesMacAddresses.size === 0}
          sx={{ py: 1.5 }}
        >
          <Typography variant="body2">Done</Typography>
        </Button>
      </Stack>
    </Drawer>
  );
}
