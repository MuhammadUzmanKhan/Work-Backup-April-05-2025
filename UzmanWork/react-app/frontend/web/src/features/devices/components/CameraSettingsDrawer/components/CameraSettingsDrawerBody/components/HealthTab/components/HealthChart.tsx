import { getHealthChartOptions } from "./utils";
import { isDefined, DATE_WITH_TIME_AND_ZONE } from "coram-common-utils";
import ReactApexChart from "react-apexcharts";
import { TimeInterval } from "utils/time";
import { UptimeRecord } from "../types";
import { useMemo } from "react";
import { useTheme } from "@mui/material";

interface HealthChartProps {
  timeInterval: TimeInterval;
  uptimeData: UptimeRecord[];
}

export function HealthChart({ timeInterval, uptimeData }: HealthChartProps) {
  const theme = useTheme();
  const uptimeColor = theme.palette.secondary.main;
  const downtimeColor = theme.palette.error.main;

  const chartData = useMemo(
    () =>
      uptimeData.map(({ type, interval }) => ({
        x: "Uptime Report",
        y: [interval.timeStart.toMillis(), interval.timeEnd.toMillis()],
        fillColor: type === "Online" ? uptimeColor : downtimeColor,
      })),
    [uptimeData, uptimeColor, downtimeColor]
  );

  return (
    <ReactApexChart
      options={{
        ...getHealthChartOptions(timeInterval),
        tooltip: {
          custom: (options) => {
            const dataPoint = uptimeData[options.dataPointIndex];
            if (!isDefined(dataPoint)) {
              return "";
            }

            const interval = dataPoint.interval;
            return `
                <div class="apexcharts-tooltip-rangebar">
                  <span>
                    ${dataPoint.type}:
                    ${interval.timeStart.toFormat("MM/dd/yy, h:mm:ss")} -
                    ${interval.timeEnd.toFormat(DATE_WITH_TIME_AND_ZONE)}
                  </span>
                </div>`;
          },
        },
      }}
      series={[{ data: chartData }]}
      type="rangeBar"
      height="250px"
    />
  );
}
