import { Dialog, Divider, IconButton, Stack, Typography } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { Duration } from "luxon";
import {
  CameraResponse,
  VideoResRequestType,
  getStaticResolutionConfig,
  getTimezoneFromCamera,
} from "coram-common-utils";
import { useTimeIntervalUpdater } from "hooks/useVideoTimeUpdater";
import { useContext, useState } from "react";
import { formatDateTime } from "utils/dates";
import { ErrorState, requestClipFileUrlAndFileName } from "./timeline/utils";
import {
  INITIAL_ERROR_STATE,
  PanelSubmitButton,
} from "./timeline/common_panel/PanelSubmitButton";
import { PanelDateTimePickers } from "./timeline/common_panel/PanelDateTimePickers";
import { initiateFileDownload } from "utils/file_save";
import { TimeInterval } from "utils/time";
import { NotificationContext } from "contexts/notification_context";

// Max time we can download in minutes
const MAX_DOWNLOAD_DURATION = Duration.fromObject({
  minutes: 30,
});

interface DownloadCreateDialogProps {
  open: boolean;
  clipTimeInterval: TimeInterval | null;
  onCloseClick: VoidFunction;
  currentStream: CameraResponse;
}

export function DownloadCreateDialog({
  open,
  clipTimeInterval,
  onCloseClick,
  currentStream,
}: DownloadCreateDialogProps) {
  const timezone = getTimezoneFromCamera(currentStream);
  const { setNotificationData } = useContext(NotificationContext);
  const { timeInterval, setStartTime, setEndTime } = useTimeIntervalUpdater(
    clipTimeInterval,
    timezone
  );
  const [errors, setErrors] = useState<ErrorState>(INITIAL_ERROR_STATE);
  async function urlAndFileNameCb() {
    const kinesisOption = {
      requestType: "clip" as const,
      mac_address: currentStream.camera.mac_address,
      start_time: formatDateTime(timeInterval.timeStart),
      end_time: formatDateTime(timeInterval.timeEnd),
      resolution_config: getStaticResolutionConfig(VideoResRequestType.HIGH),
    };
    // TODO: use a different model other than KinesisVideoClipRequestFromClient
    // for the requestClipFileUrlAndFileName argument.
    return requestClipFileUrlAndFileName(
      true,
      kinesisOption,
      currentStream.location,
      currentStream.camera.name
    );
  }

  async function handleDownloadButtonClick() {
    try {
      const { url, fileName } = await urlAndFileNameCb();
      console.debug(`Downloading ${url} as ${fileName}`);
      await initiateFileDownload(url, fileName);
      setNotificationData({
        severity: "success",
        message: "Clip downloaded successfully!",
      });
    } catch (error) {
      console.error("Error downloading clip:", error);
      setNotificationData({
        severity: "error",
        message: "Failed to download clip. Please try again later.",
      });
    }
  }

  return (
    <Dialog onClose={onCloseClick} open={open}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        p="1rem"
      >
        <Typography variant="h3">Download</Typography>
        <IconButton onClick={onCloseClick} sx={{ p: 0 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />
      <Stack
        sx={{
          p: "1.25rem 1rem",
          gap: "1.25rem",
          justifyContent: "center",
          minHeight: "9.5rem",
        }}
      >
        <PanelDateTimePickers
          timezone={timezone}
          startTime={timeInterval.timeStart}
          endTime={timeInterval.timeEnd}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          errors={errors}
          setErrors={setErrors}
          maxDurationBetweenStartAndEndTime={MAX_DOWNLOAD_DURATION}
          maxDurationBetweenStartAndEndTimeText="download duration"
          direction="row"
        />
        <PanelSubmitButton
          errors={errors}
          setErrors={setErrors}
          processClickCb={handleDownloadButtonClick}
          buttonTextCb={(isLoading: boolean) =>
            isLoading ? "Downloading" : "Download"
          }
        />
      </Stack>
    </Dialog>
  );
}
