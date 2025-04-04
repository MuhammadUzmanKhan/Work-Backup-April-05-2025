import { Grid } from "@mui/material";
import type { SxProps } from "@mui/material";
import { CameraResponse } from "coram-common-utils";
import { ScreenSize, useScreenSize } from "components/layout/DesktopOnly";
import { TimelineVideoClip } from "components/timeline/TimelineVideoClip";
import { DateTime } from "luxon";
import { ThumbnailResponseWithJSDate } from "utils/thumbnails_types";

function removeClipFromList(
  clip: ClipData,
  userSelectedClips: Array<ClipData>
) {
  return userSelectedClips.filter((c) => c !== clip);
}

function addClipToList(clip: ClipData, userSelectedClips: Array<ClipData>) {
  // Remove to avoid duplicates
  const dedupedUserSelectedClips = removeClipFromList(clip, userSelectedClips);
  return [...dedupedUserSelectedClips, clip];
}

function onCheckBoxChange(
  checked: boolean,
  clip: ClipData,
  selectionProps: SelectionProps
) {
  checked
    ? selectionProps.setUserSelectedClips(
        addClipToList(clip, selectionProps.userSelectedClips)
      )
    : selectionProps.setUserSelectedClips(
        removeClipFromList(clip, selectionProps.userSelectedClips)
      );
}

export interface ClipData {
  startTime: DateTime;
  endTime: DateTime;
  camera: CameraResponse;
  thumbnailData?: ThumbnailResponseWithJSDate;
  faceOccurrenceId?: number;
}

interface SelectionProps {
  userSelectedClips: Array<ClipData>;
  setUserSelectedClips: React.Dispatch<React.SetStateAction<Array<ClipData>>>;
}

interface ClipsGridProps {
  clips: Array<ClipData>;
  displayDate?: boolean;
  displayCameraName?: boolean;
  clipStyle?: SxProps | undefined;
  colSize?: number;
  useCheckBox?: boolean;
  selectionProps?: SelectionProps;
  onClipEnd?: () => void;
}

export function ClipsGrid({
  clips,
  displayDate,
  displayCameraName,
  clipStyle,
  colSize = 2.4,
  selectionProps = undefined,
  onClipEnd,
}: ClipsGridProps) {
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
            checkBoxProps={
              selectionProps
                ? {
                    checked: selectionProps.userSelectedClips.includes(clip),
                    onCheckBoxChange: (checked: boolean) =>
                      onCheckBoxChange(checked, clip, selectionProps),
                  }
                : undefined
            }
            onVideoClipEnd={onClipEnd}
          />
        </Grid>
      ))}
    </Grid>
  );
}
