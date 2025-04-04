import {
  type CameraDataSourceWithROI,
  type LineCrossingCameraDataSource,
} from "coram-common-utils";

export interface EditReportConfigurationProps<ReportConfiguration> {
  configuration: ReportConfiguration;
  onConfigurationChange: (configuration: ReportConfiguration) => void;
}

export type CameraBasedDataSource =
  | CameraDataSourceWithROI
  | LineCrossingCameraDataSource;
