import { Stack, Typography } from "@mui/material";
import { useState } from "react";

import { PLAYER_OPTIONS_SCRUB_BAR } from "utils/player_options";
import {
  CameraResponse,
  isNonEmptyArray,
  VideoResRequestType,
  getDynamicResolutionConfig,
  getPlayerCamera,
  getStaticResolutionConfig,
  getTimezoneFromCamera,
  MountIf,
} from "coram-common-utils";
import { formatDateTime } from "utils/dates";
import { ErrorState, MAX_ARCHIVE_DURATION } from "components/timeline/utils";
import { PanelDateTimePickers } from "components/timeline/common_panel/PanelDateTimePickers";
import { INITIAL_ERROR_STATE } from "components/timeline/common_panel/PanelSubmitButton";
import { useArchivesSummary } from "hooks/archive_page";
import { StyledToggleButton } from "components/styled_components/StyledToggleButton";
import { FixedSizeVideoPlayer } from "components/video/FixedSizeVideoPlayer";
import { TimeInterval } from "utils/time";
import { useTimeIntervalUpdater } from "hooks/useVideoTimeUpdater";
import { isIOS } from "utils/isIOS";
import { DrawerWithHeader } from "components/common";
import { AddClipToExistingArchive, CreateNewArchive } from "./components";

interface CreateArchiveDrawerProps {
  cameraResponse: CameraResponse;
  clipTimeInterval: TimeInterval | null;
  open: boolean;
  onClose: VoidFunction;
}

export function CreateArchiveDrawer(props: CreateArchiveDrawerProps) {
  return (
    <DrawerWithHeader
      title="Archive"
      open={props.open}
      onClose={props.onClose}
      width="28rem"
    >
      {/*A separate component for Body is used to reset the state when the drawer is closed.*/}
      <MountIf condition={props.open}>
        <CreateArchiveDrawerBody {...props} />
      </MountIf>
    </DrawerWithHeader>
  );
}

function CreateArchiveDrawerBody({
  cameraResponse,
  clipTimeInterval,
  onClose,
}: CreateArchiveDrawerProps) {
  const [archiveDrawerMode, setArchiveDrawerMode] = useState<
    "Create New" | "Add to Existing"
  >("Create New");

  const { data: archives } = useArchivesSummary();

  const timezone = getTimezoneFromCamera(cameraResponse);
  const { timeInterval, setStartTime, setEndTime } = useTimeIntervalUpdater(
    clipTimeInterval,
    timezone
  );

  const [timePickerErrors, setTimePickerErrors] =
    useState<ErrorState>(INITIAL_ERROR_STATE);
  const hasTimePickerErrors =
    timePickerErrors.isStartTimeInvalid || timePickerErrors.isEndTimeInvalid;

  const useDynamicResolution = !isIOS();

  return (
    <>
      <Stack gap={2} flexGrow={1}>
        <FixedSizeVideoPlayer
          desktopWidth="26rem"
          videoName={cameraResponse.camera.name}
          kinesisUrlSource={{
            camera: getPlayerCamera(cameraResponse),
            kinesisOptions: {
              requestType: "clip",
              mac_address: cameraResponse.camera.mac_address,
              start_time: formatDateTime(timeInterval.timeStart),
              end_time: formatDateTime(timeInterval.timeEnd),
              resolution_config: useDynamicResolution
                ? getDynamicResolutionConfig(VideoResRequestType.HIGH)
                : getStaticResolutionConfig(VideoResRequestType.LOW),
            },
          }}
          playerOptions={{
            htmlPlayerOptions: PLAYER_OPTIONS_SCRUB_BAR,
            isLiveStream: false,
          }}
          allowPanZoom={false}
          videoPlayerContainerSx={{
            cursor: "pointer",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        />
        <StyledToggleButton
          currentValue={archiveDrawerMode}
          button1Data={{ value: "Create New" }}
          button2Data={{
            value: "Add to Existing",
            disabled: archives.length === 0,
            disabledReason: "You don't have any existing archives",
          }}
          onChange={(value) => setArchiveDrawerMode(value)}
          sx={{ pb: 1 }}
        />
        <PanelDateTimePickers
          timezone={timezone}
          startTime={timeInterval.timeStart}
          endTime={timeInterval.timeEnd}
          setStartTime={setStartTime}
          setEndTime={setEndTime}
          errors={timePickerErrors}
          setErrors={setTimePickerErrors}
          maxDurationBetweenStartAndEndTime={MAX_ARCHIVE_DURATION}
          maxDurationBetweenStartAndEndTimeText="duration of archive video"
          direction="row"
          flexGrow={1}
          textFieldProps={{
            InputProps: {
              sx: { minHeight: "40px" },
            },
          }}
        />
        <MountIf condition={archiveDrawerMode === "Create New"}>
          <CreateNewArchive
            macAddress={cameraResponse.camera.mac_address}
            clipTimeInterval={timeInterval}
            hasErrors={hasTimePickerErrors}
            onClose={onClose}
          />
        </MountIf>
        <MountIf condition={archiveDrawerMode === "Add to Existing"}>
          {isNonEmptyArray(archives) ? (
            <AddClipToExistingArchive
              archives={archives}
              macAddress={cameraResponse.camera.mac_address}
              clipTimeInterval={timeInterval}
              hasErrors={hasTimePickerErrors}
              onClose={onClose}
            />
          ) : (
            <Typography variant="body1">
              You do not have any existing archives
            </Typography>
          )}
        </MountIf>
      </Stack>
    </>
  );
}
