import { DateTime } from "luxon";
import { TimeInterval } from "utils/time";
import { ClipData } from "../ClipsGrid";
import { PlayerModalAction } from "pages/TimelinePage";
import { DownloadCreateDialog } from "components/DownloadCreateDialog";
import { ShareCreateDialog } from "components/ShareCreateDialog";
import { CreateArchiveDrawer } from "features/archive/components";

export interface JourneyTime {
  timeInterval: TimeInterval;
  detectionTime: DateTime;
}

export function getJourneyTime(
  detectionTime: DateTime,
  pastMins: number,
  futureMins: number
): JourneyTime {
  return {
    timeInterval: {
      timeStart: detectionTime.minus({
        minutes: Number(pastMins),
      }),
      timeEnd: detectionTime.plus({
        minutes: Number(futureMins),
      }),
    },
    detectionTime: detectionTime,
  };
}

export function showSelectedPlayerDialog(
  clip: ClipData,
  modalType: PlayerModalAction,
  closeModal: VoidFunction
) {
  const clipTimeInterval = {
    timeStart: clip.startTime,
    timeEnd: clip.endTime,
  };

  switch (modalType) {
    case "showShareVideo":
      return (
        <ShareCreateDialog
          open
          onCloseClick={closeModal}
          currentStream={clip.camera}
          clipTimeInterval={clipTimeInterval}
        />
      );
    case "showArchive":
      return (
        <CreateArchiveDrawer
          open
          onClose={closeModal}
          cameraResponse={clip.camera}
          clipTimeInterval={clipTimeInterval}
        />
      );
    case "showDownload":
      return (
        <DownloadCreateDialog
          open
          onCloseClick={closeModal}
          currentStream={clip.camera}
          clipTimeInterval={clipTimeInterval}
        />
      );
    default:
      return null;
  }
}
