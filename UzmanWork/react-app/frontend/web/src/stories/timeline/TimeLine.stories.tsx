import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { DetectionObjectTypeCategory } from "coram-common-utils";
import {
  TimeLineHandle,
  TimeLineZoomFree,
} from "components/zoom_free_timeline/TimeLine";
import { DateTime } from "luxon";
import thumbnail_query_handler from "mocks/thumbnail_query_handler";
import { useRef } from "react";

const meta: Meta<typeof TimeLineZoomFree> = {
  title: "Timeline/TimeLine",
  component: TimeLineZoomFree,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: thumbnail_query_handler,
    },
  },
};
export default meta;

type Story = StoryObj<typeof TimeLineZoomFree>;

function TimeLineWrapped() {
  const timeLineRef = useRef<TimeLineHandle>(null);
  return (
    <Box sx={{ width: "80vw" }}>
      <TimeLineZoomFree
        ref={timeLineRef}
        detections={[]}
        day={DateTime.now()}
        cameraMacAddress="CAMERA_MAC_ADDRESS"
        timeLineConfig={{
          allowedTypes: [
            DetectionObjectTypeCategory.PERSON,
            DetectionObjectTypeCategory.VEHICLE,
            DetectionObjectTypeCategory.MOTION,
          ],
          seriesHeightPx: 25,
          onTimeLineClick: () => null,
        }}
      />
    </Box>
  );
}

export const BasicTimeLine: Story = { render: () => <TimeLineWrapped /> };
