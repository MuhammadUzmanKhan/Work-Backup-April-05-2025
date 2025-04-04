import type { Meta, StoryObj } from "@storybook/react";
import { DisabledBox } from "components/video/DisabledBox";
import { ErrorBox } from "components/video/ErrorBox";
import { PlaceHolderVideoPlayer } from "components/video/PlaceHolderVideoPlayer";

const meta: Meta<typeof PlaceHolderVideoPlayer> = {
  title: "VideoPlayer/PlaceHolderVideoPlayer",
  component: PlaceHolderVideoPlayer,
  tags: ["autodocs"],
};

const VIDEO_NAME = "test-video-name";
const POSTER_URL = "https://dummyimage.com/640x360/415f/bbbb";

export default meta;
type Story = StoryObj<typeof PlaceHolderVideoPlayer>;

export const Offline: Story = {
  args: {
    videoName: VIDEO_NAME,
    showBorder: true,
    children: (
      <ErrorBox errorMsg={"Camera is offline"} backgroundImage={POSTER_URL} />
    ),
  },
};

export const Error: Story = {
  args: {
    videoName: VIDEO_NAME,
    showBorder: true,
    children: <ErrorBox errorMsg={"Error!"} backgroundImage={POSTER_URL} />,
  },
};

export const Disable: Story = {
  args: {
    videoName: VIDEO_NAME,
    showBorder: true,
    children: <DisabledBox backgroundImage={POSTER_URL} />,
  },
};
