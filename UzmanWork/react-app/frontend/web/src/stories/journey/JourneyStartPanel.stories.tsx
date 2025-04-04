import type { Meta, StoryObj } from "@storybook/react";
import { JourneyStartPanel } from "components/timeline/journey/JourneyStartPanel";
import { DateTime } from "luxon";
import journey_handler from "mocks/journey_handlers";

const meta: Meta<typeof JourneyStartPanel> = {
  title: "Journey/JourneyStartPanel",
  component: JourneyStartPanel,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: journey_handler,
    },
  },
};

export default meta;
type Story = StoryObj<typeof JourneyStartPanel>;

export const StartPanel: Story = {
  args: {
    startTime: DateTime.fromISO("2021-10-01T00:00:00.000Z"),
    endTime: DateTime.fromISO("2021-10-01T04:00:00.000Z"),
    macAddress: "00:00:00:00:00:00",
  },
};
