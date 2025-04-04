import type { SxProps } from "@mui/material";
import { CreateArchiveDrawer } from "features/archive/components";
import { useMemo, useState } from "react";
import { ThumbnailResponseWithJSDate } from "utils/thumbnails_types";
import { ClipBottomToolbar, ClipCheckboxProps } from "./ClipBottomToolbar";
import { ClipPlayerModal } from "./ClipPlayerModal";
import { ClipThumbnailPreview } from "./ClipThumbnailPreview";
import { getTimeLabel, requestClipFileUrlAndFileName } from "./utils";
import { ClipData } from "./ClipsGrid";
import { formatDateTime } from "utils/dates";
import {
  VideoResRequestType,
  getDynamicResolutionConfig,
  getStaticResolutionConfig,
  KinesisVideoRequest,
  MountIf,
} from "coram-common-utils";
import { useThumbnails } from "hooks/thumbnail_fetcher";
import { ShareCreateDialog } from "components/ShareCreateDialog";
import { PlayerModalAction } from "pages/TimelinePage";
import { DownloadCreateDialog } from "components/DownloadCreateDialog";
import { isIOS } from "utils/isIOS";

interface ClipProps {
  clip: ClipData;
  thumbnail?: ThumbnailResponseWithJSDate;
  displayDate?: boolean;
  displayCameraName?: boolean;
  clipStyle?: SxProps;
  checkBoxProps?: ClipCheckboxProps;
  onVideoClipEnd?: () => void;
  hideBottomToolbar?: boolean;
  extraClipBottomToolbarElement?: React.ReactNode;
}

// Component to render a video clip with thumbnails on hover and interactions.
export function TimelineVideoClip({
  clip,
  thumbnail,
  displayDate,
  displayCameraName,
  clipStyle,
  checkBoxProps = undefined,
  onVideoClipEnd,
  hideBottomToolbar = false,
  extraClipBottomToolbarElement,
}: ClipProps) {
  // memoized because it's used in hooks in children.
  const clipTimeInterval = useMemo(
    () => ({
      timeStart: clip.startTime,
      timeEnd: clip.endTime,
    }),
    [clip.startTime, clip.endTime]
  );
  // keep track of whether or not the modal dialog is open.
  const [openPlayerModal, setOpenPlayerModal] = useState(false);
  const [activeModal, setActiveModal] = useState<PlayerModalAction>();

  const supportDynamicResolution = !isIOS();
  // Get the kinesis video request for the clip.
  const kinesisRequest: KinesisVideoRequest = {
    requestType: "clip",
    mac_address: clip.camera.camera.mac_address,
    start_time: formatDateTime(clip.startTime),
    end_time: formatDateTime(clip.endTime),
    resolution_config: supportDynamicResolution
      ? getDynamicResolutionConfig(VideoResRequestType.HIGH)
      : getStaticResolutionConfig(VideoResRequestType.LOW),
  };

  const [enableFetchingThumbnails, setEnableFetchingThumbnails] =
    useState(false);
  // Fetch the thumbnails in the clip range.
  const { data: thumbnailsData, isFetching } = useThumbnails({
    cameraMacAddress: clip.camera.camera.mac_address,
    timeStart: clip.startTime,
    timeEnd: clip.endTime,
    enabled: enableFetchingThumbnails,
    maxNumImages: 200,
  });

  return (
    <>
      <ClipThumbnailPreview
        startTime={clip.startTime}
        endTime={clip.endTime}
        previewThumbnail={thumbnail}
        thumbnails={thumbnailsData}
        isFetchingThumbnail={isFetching}
        bottomToolbar={
          !hideBottomToolbar && (
            <ClipBottomToolbar
              label={getTimeLabel(
                clip.startTime,
                clip.endTime,
                "hh:mm:ss a",
                displayDate ? displayDate : false
              )}
              cameraName={displayCameraName ? clip.camera.camera.name : ""}
              urlAndFileNameCb={async () =>
                await requestClipFileUrlAndFileName(
                  true,
                  kinesisRequest,
                  clip.camera.location,
                  clip.camera.camera.name
                )
              }
              onShareIconClick={() => setActiveModal("showShareVideo")}
              onArchiveIconClick={() => setActiveModal("showArchive")}
              checkBoxProps={checkBoxProps}
              extraToolbarItem={extraClipBottomToolbarElement}
            />
          )
        }
        thumbnailStyle={clipStyle}
        onPlayClick={() => setOpenPlayerModal(true)}
        onHoverChange={setEnableFetchingThumbnails}
      />

      <ClipPlayerModal
        videoName={clip.camera.camera.name}
        open={openPlayerModal}
        onClose={() => setOpenPlayerModal(false)}
        kinesisOption={kinesisRequest}
        currentStream={clip.camera}
        onVideoEnded={onVideoClipEnd}
        onDownloadClick={async () => setActiveModal("showDownload")}
        onShareVideoClick={() => setActiveModal("showShareVideo")}
        onArchiveClick={() => setActiveModal("showArchive")}
      />

      <MountIf condition={activeModal === "showDownload"}>
        <DownloadCreateDialog
          open={activeModal === "showDownload"}
          clipTimeInterval={clipTimeInterval}
          onCloseClick={() => setActiveModal(undefined)}
          currentStream={clip.camera}
        />
      </MountIf>

      <MountIf condition={activeModal === "showShareVideo"}>
        <ShareCreateDialog
          open={activeModal === "showShareVideo"}
          clipTimeInterval={clipTimeInterval}
          onCloseClick={() => setActiveModal(undefined)}
          currentStream={clip.camera}
        />
      </MountIf>

      <CreateArchiveDrawer
        open={activeModal === "showArchive"}
        onClose={() => setActiveModal(undefined)}
        clipTimeInterval={clipTimeInterval}
        cameraResponse={clip.camera}
      />
    </>
  );
}
