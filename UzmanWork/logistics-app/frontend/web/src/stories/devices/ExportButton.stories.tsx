import type { Meta, StoryObj } from "@storybook/react";
import { ExportButton } from "components/devices/ExportButton";
import { getCameraDataCsv } from "components/devices/utils";
import devices_page_handlers from "mocks/devices_handlers";
import { randomCameraResponses } from "stories/utils_stories";

const meta: Meta<typeof ExportButton> = {
  title: "Devices/SearchInput",
  component: ExportButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: devices_page_handlers,
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExportButton>;

const CAMERA_RESPONSES = randomCameraResponses(1000);

export const ExportButtonDefault: Story = {
  args: {
    exportConfig: {
      exportFn: async () => getCameraDataCsv(CAMERA_RESPONSES),
      exportName: () => "cameras_export",
      exportFormat: "csv",
      mimeType: "text/csv",
    },
  },
};
