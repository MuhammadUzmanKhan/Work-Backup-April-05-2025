import { Box, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { VideoResRequestType } from "coram-common-utils";
import { ImageOverlay } from "components/video/ImageOverlay";
import { VideoPlayer } from "components/video/VideoPlayer";
import video_player_handlers from "mocks/video_player_handlers";
import { useState } from "react";
import { useQuery } from "react-query";
import {
  PLAYER_OPTIONS_NO_INTERACTIONS,
  PLAYER_OPTIONS_SCRUB_BAR,
} from "utils/player_options";

const meta: Meta<typeof VideoPlayer> = {
  title: "VideoPlayer/VideoPlayer",
  component: VideoPlayer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: video_player_handlers,
    },
  },
};

function VideoPlayerWrapped(args: Parameters<typeof VideoPlayer>[0]) {
  return (
    <div style={{ width: 750 }}>
      <VideoPlayer {...args} />
    </div>
  );
}

export default meta;
type Story = StoryObj<typeof VideoPlayer>;

export const LiveMode: Story = {
  args: {
    videoName: "test-video-name",
    showBorder: true,
    kinesisUrlSource: {
      uniqueHash: "hash",
      sharedData: {
        live_stream_name: "test-stream-name",
        start_time: "2021-10-01T00:00:00.000Z",
        end_time: "2021-10-01T00:00:00.000Z",
        camera_name: "test-camera-name",
        mac_address: "test-mac-address",
        is_audio_enabled: true,
      },
      resolutionConfig: {
        static_resolution: VideoResRequestType.HIGH,
      },
      preferWebrtc: false,
    },
    playerOptions: {
      htmlPlayerOptions: PLAYER_OPTIONS_NO_INTERACTIONS,
      isLiveStream: true,
    },
    onHDIconClick: () => {
      return null;
    },
  },
  render: (args) => <VideoPlayerWrapped {...args} />,
};

export const Replay: Story = {
  args: {
    ...LiveMode.args,
    playerOptions: {
      htmlPlayerOptions: PLAYER_OPTIONS_SCRUB_BAR,
      isLiveStream: false,
    },
  },
  render: (args) => <VideoPlayerWrapped {...args} />,
};

type VideoPlayerWrappedWithControlsProps = {
  disableFastForward: boolean;
  disableFullscreen: boolean;
};

function VideoPlayerWrappedWithControls({
  disableFastForward,
  disableFullscreen,
}: VideoPlayerWrappedWithControlsProps) {
  if (LiveMode.args?.kinesisUrlSource === undefined) {
    throw new Error("kinesisUrlSource is undefined");
  }
  return (
    <VideoPlayerWrapped
      {...LiveMode.args}
      kinesisUrlSource={LiveMode.args.kinesisUrlSource}
      playerOptions={{
        htmlPlayerOptions: {
          ...PLAYER_OPTIONS_NO_INTERACTIONS,
          videoControlOptions: {
            disableFastForward,
            disableFullscreen,
          },
        },
        isLiveStream: false,
      }}
    />
  );
}

export const CustomControls: StoryObj<typeof VideoPlayerWrappedWithControls> = {
  args: {
    disableFastForward: false,
    disableFullscreen: false,
  },
  render: (args) => <VideoPlayerWrappedWithControls {...args} />,
};

function VideoPlayerWithImageButton(args: Parameters<typeof VideoPlayer>[0]) {
  const [showImage, setShowImage] = useState(false);
  const { data: imageBlob, isFetching } = useQuery({
    queryKey: ["img"],
    queryFn: async () =>
      await (await fetch("https://dummyimage.com/640x360/eee/aaa")).blob(),
  });
  return (
    <Box>
      <Box
        height={400}
        sx={{
          resize: "both",
          overflow: "auto",
        }}
      >
        <VideoPlayer
          {...args}
          canvasDraw={({ videoSize }) => {
            if (showImage && imageBlob !== undefined) {
              return (
                <ImageOverlay
                  size={videoSize}
                  imageBlob={imageBlob}
                  isFetchingImage={isFetching}
                />
              );
            }
            return <></>;
          }}
        />
      </Box>
      <Button onClick={() => setShowImage(!showImage)}>Show/Hide Image</Button>
    </Box>
  );
}
export const OverlayedImage: StoryObj<typeof VideoPlayerWrapped> = {
  args: {
    ...LiveMode.args,
  },
  render: (args) => <VideoPlayerWithImageButton {...args} />,
};

function VideoPlayerOverlayLoading(args: Parameters<typeof VideoPlayer>[0]) {
  return (
    <Box>
      <Box
        height={400}
        sx={{
          resize: "both",
          overflow: "auto",
        }}
      >
        <VideoPlayer
          {...args}
          canvasDraw={({ videoSize }) => {
            return (
              <ImageOverlay
                size={videoSize}
                imageBlob={undefined}
                isFetchingImage={true}
              />
            );
          }}
        />
      </Box>
    </Box>
  );
}
export const OverlayedLoading: StoryObj<typeof VideoPlayerWrapped> = {
  args: {
    ...LiveMode.args,
  },
  render: (args) => <VideoPlayerOverlayLoading {...args} />,
};
