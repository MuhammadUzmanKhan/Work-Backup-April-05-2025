import {
  AnalyticsResponse,
  DetectionObjectTypeCategory,
} from "coram-common-utils";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useObjectDetectionAnalytics } from "hooks/analytics";
import { DateTime } from "luxon";

interface createChartOptionsProps {
  chartTitle: string;
  seriesData: number[];
  xAxisCategories: string[];
  chartColors: [string];
  timezone: string;
  onTimeChange: (startTime: DateTime) => void;
}

export function createChartOptions({
  chartTitle,
  seriesData,
  xAxisCategories,
  chartColors,
  timezone,
  onTimeChange,
}: createChartOptionsProps): ApexOptions {
  // Get the max limit to be set for the y axis
  const yAxisMaxLimit = Math.max(4, ...seriesData) + 1;

  return {
    chart: {
      type: "area",
      height: 350,
      background: "#ffffff",
      events: {
        markerClick: function (event, chartContext, { dataPointIndex }) {
          const date = chartContext.w.config.xaxis.categories[dataPointIndex];
          onTimeChange(
            DateTime.fromISO(date, { zone: "UTC" }).setZone(timezone, {
              keepLocalTime: true,
            })
          );
        },
      },
    },
    title: {
      text: chartTitle,
      align: "left",
      offsetX: 6,
      offsetY: 5,
      style: {
        fontSize: "18px",
        fontWeight: 600,
        fontFamily: "Rubik",
      },
    },
    xaxis: {
      type: "datetime",
      categories: xAxisCategories,
      axisBorder: {
        show: false,
      },
      labels: {
        datetimeUTC: true,
        style: {
          fontSize: "12px",
          colors: "#83889E",
          fontFamily: "Rubik",
        },
      },
    },
    yaxis: {
      forceNiceScale: true,
      max: yAxisMaxLimit,
      labels: {
        style: {
          colors: "#83889E",
          fontSize: "12px",
          fontFamily: "Rubik",
        },
      },
    },
    grid: {
      show: true,
      strokeDashArray: 1,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    colors: chartColors,
    stroke: {
      curve: "smooth",
      width: 2,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      x: {
        format: "MM/dd/yy HH:mm",
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.8,
        opacityTo: 0.7,
        stops: [0, 100],
      },
    },
  };
}

interface DetectionAnalyticsChartProps {
  analytics: AnalyticsResponse;
  objectType: DetectionObjectTypeCategory;
  chartTitle: string;
  chartColors: [string];
  timezone: string;
  onTimeChange: (startTime: DateTime) => void;
}

// Renders a detection analytics chart for the specified object type
export function DetectionAnalyticsChart({
  analytics,
  objectType,
  chartTitle,
  chartColors,
  timezone,
  onTimeChange,
}: DetectionAnalyticsChartProps) {
  // Get the object detection analytics for the specified object type
  const { objectCounts, objectTimestamps } = useObjectDetectionAnalytics(
    analytics,
    objectType,
    timezone
  );

  const chartOptions = createChartOptions({
    chartTitle: chartTitle,
    seriesData: objectCounts,
    xAxisCategories: objectTimestamps,
    chartColors: chartColors,
    timezone: timezone,
    onTimeChange,
  });

  return (
    <ReactApexChart
      options={chartOptions}
      series={[{ name: chartTitle, data: objectCounts }]}
      type="area"
      height={350}
    />
  );
}
