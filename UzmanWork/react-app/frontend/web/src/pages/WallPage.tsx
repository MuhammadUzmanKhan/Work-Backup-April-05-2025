import { Box, Card, Stack } from "@mui/material";
import { VideoGrid } from "components/VideoGrid";
import { PaginationNavigator } from "components/devices/PaginationUtils";
import {
  MobileOnly,
  isNative,
  useIsMobile,
} from "components/layout/MobileOnly";
import { BottomNavBar } from "components/mobile_footer/BottomNavBar";
import { WallLayout } from "components/wall/WallLayoutSelector";
import { WallFilters, WallParams } from "components/wall/WallFilters";
import { WallHeaderRight } from "components/wall/WallHeaderRight";
import { useEffect, useRef, useState } from "react";
import { getVideoName } from "utils/globals";
import {
  getGridWidthInStorage,
  getOrgWallParamsInStorage,
  setGridWidthInStorage,
  setWallParamsInStorage,
} from "utils/local_storage";
import {
  useOrganizationContext,
  useLocations,
  useCameraGroupsWithLocation,
  useCamerasByCameraGroupId,
} from "coram-common-utils";
import { PLAYER_OPTIONS_LIVE } from "utils/player_options";
import { useSearchParams } from "utils/search_params";
import { useFullScreenToggle } from "hooks/full_screen";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import {
  getLiveWallLayoutFromSession,
  setLiveWallLayoutInSession,
} from "utils/session_storage";

export function WallPage() {
  const { organization } = useOrganizationContext();
  const { data: locations } = useLocations(false);
  const { data: groups } = useCameraGroupsWithLocation(false);

  const { searchParams, setSearchParams } = useSearchParams();
  // Whether we are on a mobile device
  const isMobile = useIsMobile();
  // zero-indexed page
  const [page, setPage] = useState<number>(0);
  const [wallParams, setWallParams] = useState<WallParams>(
    getOrgWallParamsInStorage(organization.id) ?? {
      location: undefined,
      cameraGroup: undefined,
      organization: organization,
    }
  );
  const [wallLayout, setWallLayout] = useState<WallLayout>(
    getLiveWallLayoutFromSession()
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const wallGridContainer = useRef<HTMLDivElement>(null);
  useFullScreenToggle(wallGridContainer);

  const currentCameraResponses = useCamerasByCameraGroupId({
    cameraGroupId: wallParams.cameraGroup?.id,
    locationId: wallParams.location?.id,
  }).filter((cameraResponse) => {
    if (searchQuery === "") return true;
    const searchQueryLower = searchQuery;
    const camera = cameraResponse.camera;
    return (
      camera.name.toLowerCase().includes(searchQueryLower) ||
      camera.mac_address.toLowerCase().includes(searchQueryLower) ||
      camera.ip.toLowerCase().includes(searchQueryLower)
    );
  });

  // Update the URL when the page changes, so that the user can see and share the URL
  useEffect(() => {
    setSearchParams({ page: (page + 1).toString() });
  }, [setSearchParams, page]);

  // Update the page when the URL changes.
  // NOTE(@lberg): We want to this only when:
  // 1. The URL changes;
  // 2. The page is still the default page (0).
  // This is the case when:
  // a. the user is navigating to the page for the first time, so we want to update the page value;
  // b. the user navigates to the first page. This causes another update, but it's not a problem.
  useEffect(() => {
    const _page = searchParams.get("page");
    setPage((page) => {
      if (!_page || page !== 0) {
        return page;
      }
      return parseInt(_page) - 1;
    });
  }, [searchParams, setPage]);

  const videoPerRow = isMobile ? 1 : wallLayout;
  const rowsPerPage = isMobile ? 9 : wallLayout;

  const [gridWidthPerc, setGridWidthPerc] = useState<number>(
    getGridWidthInStorage()
  );

  function setAndSaveGridWidthPerc(newSize: number) {
    setGridWidthPerc(newSize);
    setGridWidthInStorage(newSize);
  }

  return (
    <Card
      sx={{
        minHeight: `calc(100vh - ${TOOLBAR_HEIGHT_PX}px)`,
        display: "flex",
        flexDirection: "column",
        padding: 2,
        pb: 0,
      }}
    >
      <Stack justifyContent="space-between" direction="row" mb={2}>
        <WallFilters
          locations={locations}
          groups={groups}
          wallParams={wallParams}
          setWallParams={(wallParams) => {
            setWallParams(wallParams);
            setWallParamsInStorage(wallParams);
          }}
          onChange={() => setPage(0)}
        />
        <WallHeaderRight
          wallLayout={wallLayout}
          setWallLayout={(layout) => {
            setWallLayout(layout);
            setLiveWallLayoutInSession(layout);
          }}
          gridWidthPerc={gridWidthPerc}
          setAndSaveGridWidthPerc={setAndSaveGridWidthPerc}
          wallGridContainer={wallGridContainer.current}
          searchQuery={searchQuery}
          onSearchQueryChange={(value) => {
            setSearchQuery(value);
            setPage(0);
          }}
        />
      </Stack>

      <VideoGrid
        defaultVideoName={
          wallParams.location &&
          wallParams.cameraGroup &&
          getVideoName(wallParams.location.name, wallParams.cameraGroup.name)
        }
        page={page}
        videoPerRow={videoPerRow}
        rowsPerPage={rowsPerPage}
        cameraResponses={currentCameraResponses}
        playerOptions={{
          hideStreamName: true,
          htmlPlayerOptions: PLAYER_OPTIONS_LIVE,
          isLiveStream: true,
          hideLiveIndicator: false,
          hideTime: true,
        }}
        preferWebrtc={isNative()}
        width={`${gridWidthPerc}%`}
        ref={wallGridContainer}
      />
      {currentCameraResponses.length > 0 && (
        <Box p={1} mt="auto" alignSelf={isMobile ? "center" : "flex-end"}>
          <PaginationNavigator
            numItems={currentCameraResponses.length}
            page={page}
            setPage={setPage}
            itemsPerPage={rowsPerPage * videoPerRow}
          />
        </Box>
      )}
      <MobileOnly>
        <BottomNavBar />
      </MobileOnly>
    </Card>
  );
}
