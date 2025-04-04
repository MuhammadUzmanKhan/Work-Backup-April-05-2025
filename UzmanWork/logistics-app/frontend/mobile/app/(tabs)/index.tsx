import { ScrollView, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { WallFilters } from "../../features/wall/WallFilters";
import { useCallback, useState } from "react";
import { WallParams } from "../../features/wall/types";
import {
  HIGH_RESOLUTION_CONFIG,
  KinesisUrlFromStream,
  getPlayerCamera,
  useCameraGroupsWithLocation,
  useCamerasByCameraGroupId,
  useKeepLiveVideosAlive,
  useLocations,
  useMostRecentThumbnailsEnlarged,
  useOrganizationContext,
  useStoreLiveStreamResponses,
} from "coram-common-utils";
import { useFocusEffect } from "expo-router";
import { SimplePaginator } from "../../features/pagination";
import VideoPlayer from "../../features/video/videoPlayer/VideoPlayer";

const ELEMENTS_PER_PAGE = 4;

export default function LiveView() {
  const { organization } = useOrganizationContext();

  const { data: locations, refetch: refetchLocations } = useLocations(false);
  const { data: groups, refetch: refetchGroups } =
    useCameraGroupsWithLocation(false);

  const [wallParams, setWallParams] = useState<WallParams>({
    location: undefined,
    cameraGroup: undefined,
    organization: organization,
  });

  // TODO(@lberg): find a way to solve this, it's horrible
  useFocusEffect(
    useCallback(() => {
      refetchLocations();
      refetchGroups();
      setWallParams({
        location: undefined,
        cameraGroup: undefined,
        organization: organization,
      });
    }, [refetchLocations, refetchGroups, setWallParams, organization])
  );

  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();
  useKeepLiveVideosAlive(liveResponsesMap, {
    enabled: true,
  });

  const [page, setPage] = useState<number>(0);

  const cameraResponses = useCamerasByCameraGroupId({
    cameraGroupId: wallParams.cameraGroup?.id,
    locationId: wallParams.location?.id,
  });

  const pageCameraResponses = cameraResponses.slice(
    page * ELEMENTS_PER_PAGE,
    (page + 1) * ELEMENTS_PER_PAGE
  );

  const { data: mostRecentThumbnails } = useMostRecentThumbnailsEnlarged({
    camera_mac_addresses: pageCameraResponses.map(
      (source) => source.camera.mac_address
    ),
    enabled: true,
  });

  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <WallFilters
        locations={locations}
        groups={groups}
        wallParams={wallParams}
        setWallParams={setWallParams}
        onChange={() => null}
      />

      <View style={{ flex: 1, width: "100%", paddingVertical: 8 }}>
        <ScrollView>
          <View style={{ gap: 4 }}>
            {pageCameraResponses.map((camera) => {
              const kinesisUrlSource: KinesisUrlFromStream = {
                camera: getPlayerCamera(camera),
                kinesisOptions: {
                  requestType: "live",
                  mac_address: camera.camera.mac_address,
                  resolution_config: HIGH_RESOLUTION_CONFIG,
                  log_live_activity: false,
                  prefer_webrtc: false,
                },
              };

              return (
                <VideoPlayer
                  key={camera.camera.id}
                  videoName={camera.camera.name}
                  posterURL={
                    mostRecentThumbnails?.get(camera.camera.mac_address)
                      ?.s3_signed_url
                  }
                  kinesisUrlSource={kinesisUrlSource}
                  onResponseFetched={addLiveStreamResponse}
                  onKinesisUrlSourceRemove={removeLiveStreamResponse}
                />
              );
            })}
          </View>
        </ScrollView>
      </View>

      <SimplePaginator
        numItems={cameraResponses.length}
        itemsPerPage={ELEMENTS_PER_PAGE}
        page={page}
        setPage={setPage}
      />
    </SafeAreaView>
  );
}
