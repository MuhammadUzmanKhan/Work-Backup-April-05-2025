import { useContext, useRef } from "react";
import {
  getStaticResolutionConfig,
  KinesisUrlFromStream,
  VideoResRequestType,
} from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { ArchiveClipData, ArchiveResponse } from "utils/archives_types";
import { ArchiveComments, ArchiveInfo } from "./components";
import { FixedSizeVideoPlayer } from "components/video/FixedSizeVideoPlayer";
import { formatDateTime } from "utils/dates";
import { PLAYER_OPTIONS_SCRUB_BAR } from "utils/player_options";
import { requestClipFileUrlAndFileName } from "components/timeline/utils";
import { initiateFileDownload } from "utils/file_save";
import { isDefined } from "utils/types";
import { Stack } from "@mui/material";

type ViewArchiveDrawerLeftPanelProps = {
  archive: ArchiveResponse;
  allowEdit: boolean;
  selectedClip: ArchiveClipData;
  onSelectClip: (clip: ArchiveClipData) => void;
  refetchArchives: () => Promise<unknown>;
  onClose: VoidFunction;
};

export function ViewArchiveDrawerLeftPanel({
  archive,
  allowEdit,
  refetchArchives,
  selectedClip,
  onSelectClip,
  onClose,
}: ViewArchiveDrawerLeftPanelProps) {
  const { setNotificationData } = useContext(NotificationContext);
  // Reference to the element to scroll to it when a clip is clicked
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  const clipKinesisUrlSource: KinesisUrlFromStream = {
    camera: {
      mac_address: selectedClip.clip.mac_address,
      name: archive.title,
      is_enabled: true,
      is_online: true,
      is_webrtc_enabled: false,
    },
    kinesisOptions: {
      requestType: "archive",
      mac_address: selectedClip.clip.mac_address,
      start_time: formatDateTime(selectedClip.clip.start_time),
      end_time: formatDateTime(selectedClip.clip.end_time),
      clip_id: selectedClip.clip.id,
      archive_id: archive.id,
      resolution_config: getStaticResolutionConfig(VideoResRequestType.HIGH),
    },
  };

  async function handleDownloadClip() {
    try {
      const { url, fileName } = await requestClipFileUrlAndFileName(
        true,
        clipKinesisUrlSource.kinesisOptions,
        undefined,
        `${archive.title}-${selectedClip.clip.id}`
      );

      setNotificationData({
        message: "Download started. Please don't close the page",
        severity: "info",
      });

      await initiateFileDownload(url, fileName);

      setNotificationData({
        message: "Archived clip downloaded successfully",
        severity: "success",
      });
    } catch (e) {
      setNotificationData({
        message: "Failed to download the archived clip",
        severity: "error",
      });
    }
  }

  return (
    <Stack gap={2}>
      <ArchiveInfo
        archiveId={archive.id}
        title={archive.title}
        description={archive.description}
        archiveOwner={archive.owner_user_email}
        allowEdit={allowEdit}
        refetchArchives={refetchArchives}
        onDrawerClose={onClose}
        ref={scrollTargetRef}
      />
      <FixedSizeVideoPlayer
        desktopWidth="100%"
        videoName={archive.title}
        kinesisUrlSource={clipKinesisUrlSource}
        playerOptions={{
          htmlPlayerOptions: PLAYER_OPTIONS_SCRUB_BAR,
          isLiveStream: false,
        }}
        // TODO(@lberg): this should come from the clip
        isAudioEnabled={true}
        allowPanZoom={false}
        onDownloadIconClick={handleDownloadClip}
        videoPlayerContainerSx={{
          borderRadius: "8px",
          overflow: "hidden",
        }}
      />
      <ArchiveComments
        archiveId={archive.id}
        onClipClick={(clipData) => {
          const clip = archive.clips.find(
            (c) => c.clip.id === clipData.clip.id
          );
          if (!isDefined(clip)) {
            console.error(`Could not find clip with ${clipData} in archive`);
            return;
          }
          onSelectClip(clip);
          scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </Stack>
  );
}
