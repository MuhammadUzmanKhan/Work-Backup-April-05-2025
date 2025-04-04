import { createChartOptions } from "components/timeline/DetectionAnalyticsChart";
import ReactApexChart from "react-apexcharts";
import { LoadingBox } from "components/video/LoadingBox";
import { WidgetProps } from "../types";
import { Typography } from "@mui/material";
import {
  isDefined,
  DashboardWidgetType,
  DEFAULT_TIMEZONE,
} from "coram-common-utils";
import { WIDGETS } from "../consts";
import { NoReportDataAvailable, WidgetContainer } from "./components";

export function LineChartWidget({
  reportName,
  isDataReady,
  data,
}: WidgetProps) {
  if (!isDataReady || !isDefined(data)) {
    return (
      <WidgetContainer>
        <LoadingBox sx={{ height: "100%", position: "relative" }} />
      </WidgetContainer>
    );
  }

  if (!WIDGETS[DashboardWidgetType.LINE_CHART].typeGuard(data)) {
    console.error("Unsupported data in Line Widget", data);
    return <Typography>Unsupported data in Line Widget</Typography>;
  }

  const hasData = data.payload.length > 0;

  return (
    <WidgetContainer>
      {hasData ? (
        <ReactApexChart
          options={createChartOptions({
            chartTitle: "",
            seriesData: data.payload.map((event) => event.event_count),
            xAxisCategories: data.payload.map((event) => event.time),
            chartColors: ["#605FFF"],
            // TODO (@slava) should take Dashboard timezone into account
            timezone: DEFAULT_TIMEZONE,
            onTimeChange: () => null,
          })}
          series={[
            {
              name: reportName,
              data: data.payload.map((event) => event.event_count),
            },
          ]}
          type="area"
          height="100%"
        />
      ) : (
        <NoReportDataAvailable />
      )}
    </WidgetContainer>
  );
}
