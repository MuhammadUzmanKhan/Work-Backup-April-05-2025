import { CircularProgress, Stack, Typography } from "@mui/material";
import { WidgetProps } from "../types";
import { DashboardWidgetType, ReportData, isDefined } from "coram-common-utils";
import { WIDGETS } from "../consts";

export function CounterWidget({ isDataReady, data }: WidgetProps) {
  return (
    <Stack>
      <Typography
        variant="h1"
        pt={2}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        Total Events:{" "}
        {!isDataReady || !isDefined(data) ? (
          <CircularProgress size={30} color="secondary" />
        ) : (
          <CounterWidgetInternal data={data} />
        )}
      </Typography>
    </Stack>
  );
}

interface CounterWidgetInternalProps {
  data: ReportData;
}

function CounterWidgetInternal({ data }: CounterWidgetInternalProps) {
  if (!WIDGETS[DashboardWidgetType.COUNTER].typeGuard(data)) {
    console.error("Unsupported data in Counter Widget", data);
    return <>Unsupported data in Counter Widget</>;
  }

  return <>{data.payload.event_count}</>;
}
