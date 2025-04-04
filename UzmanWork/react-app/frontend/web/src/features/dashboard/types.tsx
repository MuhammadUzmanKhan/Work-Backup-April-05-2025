import {
  AbsoluteTimeRange as AbsoluteTimeRangeOrig,
  ActivityInRegionReportConfiguration as ActivityInRegionReportConfigurationOrig,
  DashboardReport as DashboardReportOrig,
  DashboardReportMetadata as DashboardReportMetadataOrig,
  DashboardResponse as DashboardResponseOrig,
  type LineCrossingReportConfiguration,
  ObjectCountReportConfiguration,
  RelativeTimeRange,
  ReportConfigurationType,
} from "coram-common-utils";
import { DateTime, Duration } from "luxon";

export type ServerReportConfiguration =
  | ActivityInRegionReportConfigurationOrig
  | LineCrossingReportConfiguration
  | ObjectCountReportConfiguration;

export type ReportConfiguration =
  | ActivityInRegionReportConfiguration
  | LineCrossingReportConfiguration
  | ObjectCountReportConfiguration;

export interface ActivityInRegionReportConfiguration
  extends Omit<
    ActivityInRegionReportConfigurationOrig,
    "min_event_duration" | "max_event_time_gap"
  > {
  min_event_duration: Duration;
  max_event_time_gap: Duration;
}

export interface AbsoluteTimeRange
  extends Omit<AbsoluteTimeRangeOrig, "start_time" | "end_time"> {
  start_time: DateTime;
  end_time: DateTime;
}

export interface DashboardReportMetadata
  extends Omit<DashboardReportMetadataOrig, "time_range" | "configuration"> {
  time_range: AbsoluteTimeRange | RelativeTimeRange;
  configuration: ReportConfiguration;
}

export interface DashboardReport
  extends Omit<DashboardReportOrig, "report_metadata"> {
  report_metadata: DashboardReportMetadata;
}

export interface DashboardResponse
  extends Omit<DashboardResponseOrig, "reports"> {
  reports: DashboardReport[];
}

export function parseDashboardResponse(
  response: DashboardResponseOrig
): DashboardResponse {
  return {
    ...response,
    reports: response.reports.map(parseReport),
  };
}

export function parseReport(report: DashboardReportOrig): DashboardReport {
  return {
    ...report,
    report_metadata: {
      ...report.report_metadata,
      configuration: parseConfiguration(report.report_metadata.configuration),
      time_range: parseTimeRange(report.report_metadata.time_range),
    },
  };
}

function parseTimeRange(
  timeRange: AbsoluteTimeRangeOrig | RelativeTimeRange
): AbsoluteTimeRange | RelativeTimeRange {
  switch (timeRange.time_range_type) {
    case AbsoluteTimeRangeOrig.time_range_type.ABSOLUTE:
      return {
        time_range_type: timeRange.time_range_type,
        start_time: DateTime.fromISO(timeRange.start_time),
        end_time: DateTime.fromISO(timeRange.end_time),
      };
    case RelativeTimeRange.time_range_type.RELATIVE:
      return timeRange;
    default: {
      const _exhaustiveCheck: undefined = timeRange.time_range_type;
      throw new Error(`Unhandled time range type: ${_exhaustiveCheck}`);
    }
  }
}

function parseConfiguration(
  configuration: ServerReportConfiguration
): ReportConfiguration {
  if (isServerActivityInRegionConfiguration(configuration)) {
    return {
      ...configuration,
      min_event_duration: Duration.fromObject({
        second: configuration.min_event_duration,
      }),
      max_event_time_gap: Duration.fromObject({
        second: configuration.max_event_time_gap,
      }),
    };
  }
  return configuration;
}

function isServerActivityInRegionConfiguration(
  configuration: ServerReportConfiguration
): configuration is ActivityInRegionReportConfigurationOrig {
  return (
    configuration.report_type === ReportConfigurationType.ACTIVITY_IN_REGION
  );
}

export function isClientActivityInRegionConfiguration(
  configuration: ReportConfiguration
): configuration is ActivityInRegionReportConfiguration {
  return (
    configuration.report_type === ReportConfigurationType.ACTIVITY_IN_REGION
  );
}

export function isClientLineCrossingConfiguration(
  configuration: ReportConfiguration
): configuration is LineCrossingReportConfiguration {
  return configuration.report_type === ReportConfigurationType.LINE_CROSSING;
}

export function isClientObjectCountConfiguration(
  configuration: ReportConfiguration
): configuration is ObjectCountReportConfiguration {
  return configuration.report_type === ReportConfigurationType.OBJECT_COUNT;
}

export function convertToServerReport(
  report: DashboardReport
): DashboardReportOrig {
  return {
    ...report,
    report_metadata: {
      ...report.report_metadata,
      configuration: convertToServerConfiguration(
        report.report_metadata.configuration
      ),
      time_range: convertToServerTimeRange(report.report_metadata.time_range),
    },
  };
}

export function convertToServerConfiguration(
  configuration: ReportConfiguration
): ServerReportConfiguration {
  if (isClientActivityInRegionConfiguration(configuration)) {
    return {
      ...configuration,
      min_event_duration: configuration.min_event_duration.as("seconds"),
      max_event_time_gap: configuration.max_event_time_gap.as("seconds"),
    };
  }
  return configuration;
}

function convertToServerTimeRange(
  timeRange: AbsoluteTimeRange | RelativeTimeRange
): AbsoluteTimeRangeOrig | RelativeTimeRange {
  if (isRelativeTimeRange(timeRange)) {
    return timeRange;
  }

  return {
    time_range_type: AbsoluteTimeRangeOrig.time_range_type.ABSOLUTE,
    start_time: timeRange.start_time.toISO() ?? "",
    end_time: timeRange.end_time.toISO() ?? "",
  };
}

function isRelativeTimeRange(
  timeRange: AbsoluteTimeRange | RelativeTimeRange
): timeRange is RelativeTimeRange {
  return (
    timeRange.time_range_type === RelativeTimeRange.time_range_type.RELATIVE
  );
}
