import { WidgetProps } from "../types";
import { Stack, Typography } from "@mui/material";
import { TimelineClipGrid } from "components/timeline/TimelineClipGrid";
import { useAugmentReportDataForClipWidget } from "../hooks";
import { LoadingBox } from "components/video/LoadingBox";
import {
  ClipWidgetReportData,
  DashboardWidgetType,
  isDefined,
} from "coram-common-utils";
import { useElementSize } from "hooks/element_size";
import { WIDGETS } from "../consts";
import { NoReportDataAvailable, WidgetContainer } from "./components";

export function ClipsWidget({ isDataReady, data }: WidgetProps) {
  if (!isDataReady || !isDefined(data)) {
    return (
      <WidgetContainer>
        <LoadingBox sx={{ height: "100%", position: "relative" }} />
      </WidgetContainer>
    );
  }

  if (!WIDGETS[DashboardWidgetType.CLIPS].typeGuard(data)) {
    console.error("Unsupported data in Clips Widget", data);
    return <Typography>Unsupported data in Clips Widget</Typography>;
  }

  return <ClipsWidgetInternal data={data} />;
}

interface ClipsWidgetInternalProps {
  data: ClipWidgetReportData;
}

function ClipsWidgetInternal({ data }: ClipsWidgetInternalProps) {
  const { data: augmentedData, isLoading: isAugmentingData } =
    useAugmentReportDataForClipWidget(data);

  const { size, setRef } = useElementSize();

  const gridProps = size.width >= 800 ? { xs: 2 } : { xs: 4 };

  const hasData = augmentedData.length > 0;

  return (
    <Stack height="20rem" pr={3} sx={{ overflowY: "auto" }} ref={setRef}>
      {isAugmentingData ? (
        <LoadingBox sx={{ height: "100%", position: "relative" }} />
      ) : hasData ? (
        <TimelineClipGrid
          clips={augmentedData}
          labelProps={{ variant: "h3" }}
          gridProps={gridProps}
        />
      ) : (
        <NoReportDataAvailable />
      )}
    </Stack>
  );
}
