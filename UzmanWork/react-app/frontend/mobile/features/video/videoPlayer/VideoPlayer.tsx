import { Text, Image, View } from "react-native";
import {
  KinesisUrlSource,
  useKinesisStreamResponse,
  isDefined,
  isHlsStreamResponse,
  OnStreamResponseFetchedFn,
  onKinesisUrlSourceRemoveFn,
  MountIf,
} from "coram-common-utils";
import { Spinner } from "@gluestack-ui/themed";
import Video from "react-native-video";
import type VideoRef from "react-native-video";
import { useRef, useState } from "react";
import { VideoPlayerContainer } from "./VideoPlayerContainer";
import { VideoInfoBox } from "./VideoInfoBox";

interface VideoPlayerProps {
  videoName: string;
  kinesisUrlSource: KinesisUrlSource;
  posterURL?: string;
  onResponseFetched?: OnStreamResponseFetchedFn;
  onKinesisUrlSourceRemove?: onKinesisUrlSourceRemoveFn;
}

function VideoPlayer({
  videoName,
  kinesisUrlSource,
  posterURL,
  onResponseFetched,
  onKinesisUrlSourceRemove,
}: VideoPlayerProps) {
  const { streamResponse, isError, isOffline, isDisabled } =
    useKinesisStreamResponse({
      kinesisUrlSource,
      isLiveStream: true,
      onSuccess: onResponseFetched,
      onKinesisUrlSourceRemove,
    });

  const videoRef = useRef<VideoRef>(null);
  const [hasErrorLoading, setHasErrorLoading] = useState<boolean>(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState<boolean>(false);

  if (isError) {
    return (
      <VideoPlayerContainer isLive={true} name={videoName}>
        <VideoInfoBox posterURL={posterURL}>
          <Text style={{ color: "white" }}>Error fetching stream</Text>
        </VideoInfoBox>
      </VideoPlayerContainer>
    );
  }
  if (isOffline) {
    return (
      <VideoPlayerContainer isLive={true} name={videoName}>
        <VideoInfoBox posterURL={posterURL}>
          <Text style={{ color: "white" }}>Camera is offline</Text>
        </VideoInfoBox>
      </VideoPlayerContainer>
    );
  }
  if (isDisabled) {
    return (
      <VideoPlayerContainer isLive={true} name={videoName}>
        <VideoInfoBox posterURL={posterURL}>
          <Text style={{ color: "white" }}>Camera is disabled</Text>
        </VideoInfoBox>
      </VideoPlayerContainer>
    );
  }

  const uri =
    isDefined(streamResponse) && isHlsStreamResponse(streamResponse)
      ? streamResponse.data.video_url
      : "";

  const source = hasErrorLoading
    ? { uri: undefined }
    : { uri: uri, type: "m3u8" };

  return (
    <VideoPlayerContainer isLive={true} name={videoName}>
      <Video
        ref={videoRef}
        source={source}
        muted={true}
        controls={true}
        automaticallyWaitsToMinimizeStalling={false}
        minLoadRetryCount={1}
        style={{
          width: "100%",
          height: "100%",
        }}
        onError={(error) => {
          // NOTE(@lberg): this is a hack, but for now
          // we will keep it
          // NOTE(@lberg): the issue here is that there is no
          // imperative way to set the source of the video
          setHasErrorLoading(true);
          setTimeout(() => {
            setHasErrorLoading(false);
          }, 250);
          console.log(JSON.stringify(error));
        }}
        onReadyForDisplay={() => {
          setHasStartedPlaying(true);
        }}
      />
      <MountIf condition={!hasStartedPlaying}>
        <View
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={{ uri: posterURL }}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              resizeMode: "contain",
            }}
          />
          <Spinner size="large" />
        </View>
      </MountIf>
    </VideoPlayerContainer>
  );
}

export default VideoPlayer;
