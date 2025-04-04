import type { Meta, StoryObj } from "@storybook/react";
import {
  video_page_handlers,
  video_page_not_found_handlers,
} from "mocks/video_page_handlers";
import { PublicVideoPage } from "pages/PublicVideoPage";

const meta: Meta<typeof PublicVideoPage> = {
  title: "VideoPage/VideoPage",
  component: PublicVideoPage,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: video_page_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof PublicVideoPage>;

export const VideoPageNotFound: Story = {
  parameters: {
    msw: {
      handlers: video_page_not_found_handlers,
    },
  },
};

export const VideoPageDefault: Story = {};
