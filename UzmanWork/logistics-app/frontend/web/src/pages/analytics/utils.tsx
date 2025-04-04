import {
  CameraResponse,
  DetectionObjectTypeCategory,
  FaceOccurrenceResponse,
} from "coram-common-utils";
import { DateTime } from "luxon";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";

export const TAB_STYLE = {
  fontWeight: "400",
  fontSize: "14px",
  color: "#3C3E49",
  backgroundColor: "common.white",
  borderBottom: "1px solid #DFE0E6",
  borderColor: "#DFE0E6",
  height: "1.5rem",
  minHeight: "2.5rem",
  minWidth: "7.25rem",
  paddingX: "1.4rem",
  paddingY: "0.2rem",
  borderRadius: "0.625rem 0.625rem 0 0",
  "&.Mui-selected": {
    color: "primary.main",
    backgroundColor: "none",
    border: "1px solid #DFE0E6",
    borderBottomColor: "transparent",
    fontWeight: 500,
  },
  "&.MuiTabs-indicator": {
    display: "none",
  },
};
export interface TabItem {
  label: string;
  value: string;
  component: JSX.Element;
}

export function getIntervalsFromFaceOccurrences(
  faceOccurrences: Array<FaceOccurrenceResponse>,
  cameras: Map<string, CameraResponse>,
  clipPaddingParams: { startPaddingSeconds: number; endPaddingSeconds: number }
): DetectionAggregatedInterval[] {
  return faceOccurrences
    .filter((occurrence) => {
      return cameras.has(occurrence.camera_mac_address);
    })
    .map((occurrence: FaceOccurrenceResponse) => {
      const camera = cameras.get(
        occurrence.camera_mac_address
      ) as CameraResponse;
      const startTime = DateTime.fromISO(occurrence.occurrence_time)
        .setZone(camera.timezone)
        .minus({ seconds: clipPaddingParams.startPaddingSeconds });
      return {
        startTime,
        endTime: DateTime.fromISO(occurrence.occurrence_time)
          .setZone(camera.timezone)
          .plus({ seconds: clipPaddingParams.endPaddingSeconds }),
        detectionType: DetectionObjectTypeCategory.PERSON,
        camera: camera,
        thumbnailData: occurrence.person_s3_signed_url
          ? {
              timestamp: startTime,
              s3_path: "",
              s3_signed_url: occurrence.person_s3_signed_url,
            }
          : undefined,
        faceOccurrenceId: occurrence.id,
      };
    });
}
