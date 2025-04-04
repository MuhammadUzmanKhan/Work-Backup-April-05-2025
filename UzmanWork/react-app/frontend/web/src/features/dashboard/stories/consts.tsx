import {
  DashboardReportWidth,
  DashboardResponse,
  DashboardWidgetType,
  DetectionObjectTypeCategory,
  RelativeTimeRange,
  ReportConfigurationType,
} from "coram-common-utils";
import { randomCameraResponses } from "stories/utils_stories";

export const CAMERAS = randomCameraResponses(2);
export const DASHBOARD_WITH_COUNTER_REPORT: DashboardResponse = {
  id: 1,
  title: "Test Dashboard with Counter Report",
  description: "Test description",
  owner_user_email: "slava@coram.ai",
  creation_time: "2024-03-06T10:01:26.698105+00:00",
  reports: [
    {
      id: 1,
      name: "Test Counter Report",
      description: "",
      dashboard_id: 1,
      report_metadata: {
        width: DashboardReportWidth.HALF,
        time_range: {
          time_range_type: RelativeTimeRange.time_range_type.RELATIVE,
          time_interval: 86400.0,
        },
        widget_type: DashboardWidgetType.COUNTER,
        configuration: {
          object_categories: [DetectionObjectTypeCategory.MOTION],
          report_type: ReportConfigurationType.ACTIVITY_IN_REGION,
          camera_data_sources: [
            {
              mac_address: CAMERAS[0].camera.mac_address,
              roi_polygon: [
                [0.0, 0.0],
                [1.0, 1.0],
              ],
            },
          ],
          min_event_duration: 5.0,
          max_event_time_gap: 10.0,
        },
      },
    },
  ],
};

export const DASHBOARD_WITH_NO_REPORTS: DashboardResponse = {
  id: 2,
  title: "Test Dashboard with no reports",
  description: "Test description",
  owner_user_email: "slava@coram.ai",
  creation_time: "2024-03-06T10:01:26.698105+00:00",
  reports: [],
};
