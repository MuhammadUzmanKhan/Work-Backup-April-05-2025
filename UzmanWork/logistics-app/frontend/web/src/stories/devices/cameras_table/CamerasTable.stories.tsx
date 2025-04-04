import type { Meta, StoryObj } from "@storybook/react";
import { CameraResponse } from "coram-common-utils";
import { CamerasTable } from "components/devices/CamerasTable";
import streams_table_handlers from "mocks/streams_table_handlers";
import {
  generateRefetchStreamsStub,
  randomCameraResponses,
} from "../../utils_stories";

const meta: Meta<typeof CamerasTable> = {
  title: "Devices/CamerasTable/CamerasTable",
  component: CamerasTable,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: streams_table_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof CamerasTable>;

const DATA = randomCameraResponses(50);

export const Default: Story = {
  args: {
    data: DATA,
    paginationData: {
      page: 0,
      itemsPerPage: 10,
    },
    refetchStreams: generateRefetchStreamsStub<CameraResponse[]>(),
  },
};
