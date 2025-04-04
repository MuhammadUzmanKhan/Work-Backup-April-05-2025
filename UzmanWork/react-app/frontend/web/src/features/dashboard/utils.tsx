import {
  ActivityInRegionReportConfiguration,
  ReportConfiguration,
} from "./types";
import {
  DetectionObjectTypeCategory,
  LineCrossingReportConfiguration,
  ObjectCountReportConfiguration,
  ReportConfigurationType,
} from "coram-common-utils";
import { Duration } from "luxon";

export function getDefaultReportConfiguration(
  reportType: ReportConfigurationType
): ReportConfiguration {
  switch (reportType) {
    case ReportConfigurationType.ACTIVITY_IN_REGION:
      return { ...DEFAULT_ACTIVITY_IN_REGION_REPORT_CONFIGURATION };
    case ReportConfigurationType.LINE_CROSSING:
      return { ...DEFAULT_LINE_CROSSING_REPORT_CONFIGURATION };
    case ReportConfigurationType.OBJECT_COUNT:
      return { ...DEFAULT_OBJECT_COUNT_REPORT_CONFIGURATION };
  }
}

const DEFAULT_ACTIVITY_IN_REGION_REPORT_CONFIGURATION: ActivityInRegionReportConfiguration =
  {
    object_categories: [DetectionObjectTypeCategory.MOTION],
    report_type: ReportConfigurationType.ACTIVITY_IN_REGION,
    camera_data_sources: [],
    min_event_duration: Duration.fromObject({ second: 5 }),
    max_event_time_gap: Duration.fromObject({ second: 10 }),
  };

const DEFAULT_OBJECT_COUNT_REPORT_CONFIGURATION: ObjectCountReportConfiguration =
  {
    object_categories: [DetectionObjectTypeCategory.PERSON],
    report_type: ReportConfigurationType.OBJECT_COUNT,
    camera_data_sources: [],
  };

const DEFAULT_LINE_CROSSING_REPORT_CONFIGURATION: LineCrossingReportConfiguration =
  {
    object_categories: [DetectionObjectTypeCategory.PERSON],
    report_type: ReportConfigurationType.LINE_CROSSING,
    camera_data_sources: [],
  };
