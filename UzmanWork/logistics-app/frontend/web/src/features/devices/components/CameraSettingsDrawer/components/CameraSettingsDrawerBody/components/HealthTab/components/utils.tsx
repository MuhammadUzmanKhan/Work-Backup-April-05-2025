import { TimeInterval } from "utils/time";
import { type ApexOptions } from "apexcharts";

export function getHealthChartOptions(timeInterval: TimeInterval): ApexOptions {
  return {
    grid: {
      show: true,
      yaxis: {
        lines: { show: false },
      },
      padding: { left: 0 },
    },
    chart: {
      type: "rangeBar",
      offsetX: -15,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false,
      },
    },
    fill: { type: "solid" },
    plotOptions: {
      bar: {
        horizontal: true,
        rangeBarGroupRows: true,
      },
    },
    xaxis: {
      type: "datetime",
      min: timeInterval.timeStart.toMillis(),
      max: timeInterval.timeEnd.toMillis(),
    },
    yaxis: {
      show: false,
    },
  };
}
