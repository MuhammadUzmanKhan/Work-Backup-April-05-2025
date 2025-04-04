import { Box, Stack, Typography } from "@mui/material";
import {
  ApiError,
  JourneyInterval,
  JourneyService,
  VideoResRequestType,
  isDefined,
  KinesisVideoRequest,
  getDynamicResolutionConfig,
  getStaticResolutionConfig,
  MountIf,
} from "coram-common-utils";
import { ClipPlayerModal } from "components/timeline/ClipPlayerModal";
import { ClipData, ClipsGrid } from "components/timeline/ClipsGrid";
import InitialJourneyFilter from "components/timeline/journey/InitialJourneyFilter";
import { JourneyHeader } from "components/timeline/journey/JourneyHeader";
import MergedJourneyControl from "components/timeline/journey/MergedJourneyControl";
import MergedJourneyFilter from "components/timeline/journey/MergedJourneyFilter";
import TrackHeader from "components/timeline/journey/TrackHeader";
import { JourneyTime, getJourneyTime } from "components/timeline/journey/utils";
import { groupClipsByCamera } from "components/timeline/utils";
import { NotificationContext } from "contexts/notification_context";
import { useOnMount } from "hooks/lifetime";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { formatDateTime } from "utils/dates";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { customHeaderState } from "utils/globals";
import {
  TrackThumbnailResponseWithJSDate,
  journeyIntervalToDetectionAggregatedInterval,
  parseTrackThumbnailResponseWithJSDate,
} from "utils/journey_types";
import { JOURNEY_DURATION_MINUTES } from "utils/player_options";
import { augmentClipsWithThumbnails } from "utils/thumbnails";
import { PlayerModalAction } from "./TimelinePage";
import { DownloadCreateDialog } from "components/DownloadCreateDialog";
import { ShareCreateDialog } from "components/ShareCreateDialog";
import { CreateArchiveDrawer } from "features/archive/components";
import { isIOS } from "utils/isIOS";

const DEFAULT_ERROR_MSG = "Can't load search results. Try searching again.";

export enum JourneyMode {
  // Raw Journey clips are being displayed
  Initial = 0,
  // The merged Journey clips are being displayed
  Filtered = 1,
}
interface JourneyPageWithTrackProps {
  track: TrackThumbnailResponseWithJSDate;
  timezone: string;
  cameraName: string;
}

function JourneyPageWithTrack({
  track,
  timezone,
  cameraName,
}: JourneyPageWithTrackProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClips, setSelectedClips] = useState<
    DetectionAggregatedInterval[]
  >([]);
  const { setNotificationData } = useContext(NotificationContext);
  const setCustomHeader = useSetRecoilState(customHeaderState);
  // Track the clips user selected to merge Journey
  const [userSelectedClips, setUserSelectedClips] = useState(Array<ClipData>());
  // Track the userSelectedClips in auto play mode.
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  // Whether the auto player modal is open.
  const [openAutoPlayer, setOpenAutoPlayer] = useState(false);
  // Track the Journey mode
  const [journeyMode, setJourneyMode] = useState(JourneyMode.Initial);
  // Track the currentClip to load in the auto player modal
  let currentClip: ClipData | null = null;
  // Get the kinesis video request for the clip.
  let kinesisRequest: KinesisVideoRequest | null = null;
  const useDynamicResolution = !isIOS();

  const sortedUserSelectedClips = userSelectedClips.sort(
    (a: ClipData, b: ClipData) => (a.startTime < b.startTime ? -1 : 1)
  ) as Array<ClipData>;
  const [activeModal, setActiveModal] = useState<PlayerModalAction>();

  if (userSelectedClips.length > 0 && journeyMode === JourneyMode.Filtered) {
    currentClip = userSelectedClips[currentClipIndex];
    kinesisRequest = {
      requestType: "clip" as const,
      mac_address: currentClip.camera.camera.mac_address,
      start_time: formatDateTime(currentClip.startTime),
      end_time: formatDateTime(currentClip.endTime),
      resolution_config: useDynamicResolution
        ? getDynamicResolutionConfig(VideoResRequestType.HIGH)
        : getStaticResolutionConfig(VideoResRequestType.LOW),
    };
  }

  // Check if there are more clips to play on clip end
  const handleClipEnded = () => {
    if (currentClipIndex + 1 < sortedUserSelectedClips.length) {
      setCurrentClipIndex((prevIndex) => prevIndex + 1);
    } else {
      // No more sortedUserSelectedClips to play, close the auto play modal
      setOpenAutoPlayer(false);
      setCurrentClipIndex(0);
    }
  };

  // NOTE(@lberg): we can also use a hook and react-query instead of a callback
  async function fetchClips(
    journeyTime: JourneyTime,
    track: TrackThumbnailResponseWithJSDate
  ) {
    setIsLoading(true);
    let selectedClips: DetectionAggregatedInterval[] = [];
    let errorDetail = DEFAULT_ERROR_MSG;

    try {
      try {
        const searchResults = await JourneyService.journeyFromTrack({
          timestamp: formatDateTime(track.thumbnail_data.timestamp),
          camera_mac_address: track.thumbnail_data.camera_mac_address,
          track_id: track.thumbnail_data.track_id,
          perception_stack_start_id:
            track.thumbnail_data.perception_stack_start_id,
          search_start_time: formatDateTime(journeyTime.timeInterval.timeStart),
          search_end_time: formatDateTime(journeyTime.timeInterval.timeEnd),
        });

        selectedClips = searchResults.map((result: JourneyInterval) =>
          journeyIntervalToDetectionAggregatedInterval(result, timezone)
        );
      } catch (error) {
        if (error instanceof ApiError) {
          errorDetail = error.body["detail"];
        }
        throw error;
      }
      // Fetch the thumbnails for the selected clips.
      try {
        selectedClips = await augmentClipsWithThumbnails(selectedClips);
      } catch (error) {
        console.error(error);
      }
      setSelectedClips(selectedClips);
    } catch (error) {
      console.error(error);
      setNotificationData({
        message: errorDetail,
        severity: "error",
      });
      setSelectedClips([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setCustomHeader(<JourneyHeader />);
    return () => setCustomHeader(null);
  }, [setCustomHeader]);

  useOnMount(() => {
    fetchClips(
      getJourneyTime(
        track.thumbnail_data.timestamp,
        Number(JOURNEY_DURATION_MINUTES),
        Number(JOURNEY_DURATION_MINUTES)
      ),
      track
    );
  });

  useEffect(() => {
    if (journeyMode === JourneyMode.Initial) {
      setUserSelectedClips([]);
    }
  }, [journeyMode, setUserSelectedClips]);

  return (
    <Box p={4}>
      <TrackHeader track={track} cameraName={cameraName} timezone={timezone} />{" "}
      <Stack
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        pt={4}
        pb={2}
      >
        {journeyMode === JourneyMode.Initial && (
          <>
            <InitialJourneyFilter
              journeyMode={journeyMode}
              onSearch={(pastMins: number, futureMins: number) =>
                fetchClips(
                  getJourneyTime(
                    track.thumbnail_data.timestamp,
                    pastMins,
                    futureMins
                  ),
                  track
                )
              }
              setJourneyMode={setJourneyMode}
              isLoading={isLoading}
            />
            <MergedJourneyControl
              totalSelectedClips={userSelectedClips.length}
              setJourneyMode={setJourneyMode}
              handleUnselect={() => setUserSelectedClips([])}
            />
          </>
        )}
        {journeyMode === JourneyMode.Filtered && (
          <MergedJourneyFilter
            setOpenAutoPlayer={setOpenAutoPlayer}
            setJourneyMode={setJourneyMode}
          />
        )}
      </Stack>
      {journeyMode === JourneyMode.Initial &&
        Array.from(groupClipsByCamera(selectedClips).entries()).map(
          ([cameraName, groupedClips]) => (
            <Stack key={cameraName}>
              <Typography variant="body1" py={2}>
                {cameraName}
              </Typography>
              <ClipsGrid
                clips={groupedClips}
                displayDate={false}
                displayCameraName={false}
                clipStyle={{
                  height: "145px",
                  justifyContent: "center",
                  alignItems: "center",
                }}
                colSize={2}
                useCheckBox={true}
                selectionProps={{
                  userSelectedClips,
                  setUserSelectedClips,
                }}
              />
            </Stack>
          )
        )}
      {journeyMode === JourneyMode.Filtered && (
        <ClipsGrid
          clips={sortedUserSelectedClips}
          displayDate={false}
          displayCameraName={true}
          clipStyle={{
            height: "145px",
            justifyContent: "center",
            alignItems: "center",
          }}
          colSize={2}
          onClipEnd={handleClipEnded}
        />
      )}
      {/* TODO(@mustafa):make a separate component to encapsulate logic there */}
      {userSelectedClips.length > 0 && kinesisRequest && currentClip && (
        <ClipPlayerModal
          key={currentClipIndex}
          videoName={currentClip.camera.camera.name}
          open={openAutoPlayer}
          onClose={() => setOpenAutoPlayer(false)}
          kinesisOption={kinesisRequest}
          currentStream={currentClip.camera}
          onVideoEnded={handleClipEnded}
          onDownloadClick={async () => setActiveModal("showDownload")}
          onShareVideoClick={() => setActiveModal("showShareVideo")}
          onArchiveClick={() => setActiveModal("showArchive")}
        />
      )}
      <MountIf condition={activeModal === "showDownload"}>
        {isDefined(currentClip) && (
          <DownloadCreateDialog
            open={activeModal === "showDownload"}
            clipTimeInterval={{
              timeStart: currentClip.startTime,
              timeEnd: currentClip.endTime,
            }}
            onCloseClick={() => setActiveModal(undefined)}
            currentStream={currentClip.camera}
          />
        )}
      </MountIf>
      <MountIf condition={activeModal === "showShareVideo"}>
        {isDefined(currentClip) && (
          <ShareCreateDialog
            open={activeModal === "showShareVideo"}
            clipTimeInterval={{
              timeStart: currentClip.startTime,
              timeEnd: currentClip.endTime,
            }}
            onCloseClick={() => setActiveModal(undefined)}
            currentStream={currentClip.camera}
          />
        )}
      </MountIf>
      <MountIf condition={activeModal === "showArchive"}>
        {isDefined(currentClip) && (
          <CreateArchiveDrawer
            open={activeModal === "showArchive"}
            onClose={() => setActiveModal(undefined)}
            clipTimeInterval={{
              timeStart: currentClip.startTime,
              timeEnd: currentClip.endTime,
            }}
            cameraResponse={currentClip.camera}
          />
        )}
      </MountIf>
    </Box>
  );
}

export function JourneyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const track = parseTrackThumbnailResponseWithJSDate(location.state.track);
  const timezone = location.state.timezone as string | undefined;
  const cameraName = location.state.cameraName as string | undefined;

  if (!isDefined(track) || !isDefined(timezone) || !isDefined(cameraName)) {
    navigate(-1);
    return null;
  }

  return (
    <JourneyPageWithTrack
      track={track}
      timezone={timezone}
      cameraName={cameraName}
    />
  );
}
