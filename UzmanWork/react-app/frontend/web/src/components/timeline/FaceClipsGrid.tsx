import { Grid } from "@mui/material";
import type { SxProps } from "@mui/material";
import { FaceService, getTimezoneFromCamera } from "coram-common-utils";
import { ScreenSize, useScreenSize } from "components/layout/DesktopOnly";
import { TimelineVideoClip } from "components/timeline/TimelineVideoClip";
import { ClipData } from "components/timeline/ClipsGrid";
import { ToJourneyButton } from "./ToJourneyButton";
import { useNavigate } from "react-router-dom";

interface FaceClipsGridProps {
  clips: Array<ClipData>;
  displayDate?: boolean;
  displayCameraName?: boolean;
  clipStyle?: SxProps | undefined;
  colSize?: number;
  useCheckBox?: boolean;
  onClipEnd?: () => void;
}

export function FaceClipsGrid({
  clips,
  displayDate,
  displayCameraName,
  clipStyle,
  colSize = 2.4,
  onClipEnd,
}: FaceClipsGridProps) {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const defaultClipSize = "118px";

  const responsiveClipStyle = clipStyle
    ? clipStyle
    : {
        height:
          screenSize === ScreenSize.XLarge
            ? "260px"
            : screenSize === ScreenSize.Large
            ? "188px"
            : screenSize === ScreenSize.Medium
            ? "113px"
            : defaultClipSize,
        justifyContent: "center",
        alignItems: "center",
      };

  return (
    <Grid container spacing={2}>
      {clips.map((clip, idx) => (
        <Grid item xs={colSize} position="relative" key={idx}>
          <TimelineVideoClip
            clip={clip}
            thumbnail={clip.thumbnailData}
            displayDate={displayDate}
            displayCameraName={displayCameraName}
            clipStyle={responsiveClipStyle}
            onVideoClipEnd={onClipEnd}
            extraClipBottomToolbarElement={
              <ToJourneyButton
                disabled={clip.faceOccurrenceId === undefined}
                onClick={async () => {
                  if (clip.faceOccurrenceId === undefined) {
                    return;
                  }
                  const trackThumbnailResponse =
                    await FaceService.trackThumbnailFromFaceOccurrence({
                      id: clip.faceOccurrenceId,
                    });

                  const timezone = getTimezoneFromCamera(clip.camera);
                  // Set a state for the journey page
                  navigate("/timeline/journey", {
                    state: {
                      track: trackThumbnailResponse,
                      timezone: timezone,
                      cameraName: clip.camera.camera.name,
                    },
                  });
                }}
              />
            }
          />
        </Grid>
      ))}
    </Grid>
  );
}
