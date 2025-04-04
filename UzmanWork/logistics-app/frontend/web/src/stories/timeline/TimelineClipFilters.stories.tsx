import type { Meta, StoryObj } from "@storybook/react";
import {
  ClipFilters,
  CLIP_FILTER_OBJECT_TYPES,
} from "components/timeline/TimelineClipFilters";
import { ClipMode, ClipFilterState } from "components/timeline/utils";
import { DateTime } from "luxon";

const meta: Meta<typeof ClipFilters> = {
  title: "ClipFilters/ClipFilters",
  component: ClipFilters,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

const INITIAL_CLIP_FILTER_STATE: ClipFilterState = {
  timeInterval: {
    timeStart: DateTime.now().startOf("day"),
    timeEnd: DateTime.now().endOf("day"),
  },
  macAddresses: [],
  objectFilter: CLIP_FILTER_OBJECT_TYPES[0],
  searchQuery: "",
  mode: ClipMode.EVENTS,
  maxVideoLengthMin: 5,
  roi: [],
};

export default meta;
type Story = StoryObj<typeof ClipFilters>;

export const BasicClipFilters: Story = {
  args: {
    clipFilterState: INITIAL_CLIP_FILTER_STATE,
    setClipFilterState: () => null,
  },
  render: (args) => <ClipFilters {...args} />,
};
