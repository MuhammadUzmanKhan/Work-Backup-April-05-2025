import { View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import {
  CameraResponse,
  HIGH_RESOLUTION_CONFIG,
  KinesisUrlFromStream,
  getPlayerCamera,
  isDefined,
  useCamerasList,
  useFetchMostRecentThumbnailEnlarged,
  useKeepLiveVideosAlive,
  useStoreLiveStreamResponses,
} from "coram-common-utils";
import VideoPlayer from "../../features/video/videoPlayer/VideoPlayer";
import { SafeAreaView } from "react-native-safe-area-context";

interface TimelineViewProps {
  camera: CameraResponse;
}

function TimelineView({ camera }: TimelineViewProps) {
  const macAddress = camera.camera.mac_address;
  const kinesisUrlSource: KinesisUrlFromStream = {
    camera: getPlayerCamera(camera),
    kinesisOptions: {
      requestType: "live",
      mac_address: macAddress,
      resolution_config: HIGH_RESOLUTION_CONFIG,
      log_live_activity: false,
      prefer_webrtc: false,
    },
  };

  const { liveResponsesMap, addLiveStreamResponse, removeLiveStreamResponse } =
    useStoreLiveStreamResponses();
  useKeepLiveVideosAlive(liveResponsesMap, {
    enabled: true,
  });

  const mostRecentThumbnailURL = useFetchMostRecentThumbnailEnlarged({
    cameraMacAddress: camera.camera.mac_address,
  });

  return (
    <View>
      <VideoPlayer
        videoName={camera.camera.name}
        posterURL={mostRecentThumbnailURL}
        kinesisUrlSource={kinesisUrlSource}
        onResponseFetched={addLiveStreamResponse}
        onKinesisUrlSourceRemove={removeLiveStreamResponse}
      />
    </View>
  );
}

function TimelineViewWrapper() {
  const { cameraId } = useLocalSearchParams();
  const { data: cameras } = useCamerasList({ refetchOnWindowFocus: false });
  if (!isDefined(cameraId)) {
    return <Redirect href="/not-found" />;
  }
  const camera = cameras?.find(
    (camera) => camera.camera.id === Number(cameraId)
  );
  if (!camera) {
    return <Redirect href="/not-found" />;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TimelineView camera={camera} />
    </SafeAreaView>
  );
}

export default TimelineViewWrapper;
