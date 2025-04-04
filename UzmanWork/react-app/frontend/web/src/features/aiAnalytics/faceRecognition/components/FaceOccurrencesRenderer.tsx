import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import {
  CancelablePromise,
  FaceOccurrenceResponse,
  isDefined,
  useCamerasMap,
} from "coram-common-utils";
import {
  SearchCbParams,
  SearchFilter,
} from "components/common/search_filter/SearchFilter";
import { ClipData } from "components/timeline/ClipsGrid";
import { FaceClipsGrid } from "components/timeline/FaceClipsGrid";
import { useContext, useRef, useState } from "react";
import { Duration } from "luxon";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { TrackImage } from "components/timeline/journey/TrackImage";
import { NotificationContext } from "contexts/notification_context";
import { handleFaceOccurrencesUpdate } from "../utils";
import { handleSearchChange } from "components/common/search_filter/utils";
import { GoBackButton } from "components/styled_components/StyledButton";

export interface FaceOccurrencesRendererProps {
  getFaceOccurrences: (
    params: SearchCbParams
  ) => CancelablePromise<Array<FaceOccurrenceResponse>>;
  selectedFaceS3SignedUrl: string;
  selectedFaceManageElement: React.ReactNode;
  onCloseClick: () => void;
}

export function FaceOccurrencesRenderer({
  getFaceOccurrences,
  selectedFaceS3SignedUrl,
  selectedFaceManageElement,
  onCloseClick,
}: FaceOccurrencesRendererProps) {
  const { data: cameras } = useCamerasMap({
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Store the clips for the selected face.
  const [faceClips, setFaceClips] = useState<ClipData[]>();
  const [loading, setLoading] = useState<boolean>(false);
  const { setNotificationData } = useContext(NotificationContext);
  // Store the request for the face occurrences so that we can cancel it if the
  // user changes the filter before the request completes.
  const faceOccurrencesRequestRef = useRef<CancelablePromise<
    Array<FaceOccurrenceResponse>
  > | null>(null);

  async function fetchFaceOccurrences(params: SearchCbParams) {
    await handleFaceOccurrencesUpdate(
      cameras,
      () => getFaceOccurrences(params),
      (clips: DetectionAggregatedInterval[]) => setFaceClips(clips),
      faceOccurrencesRequestRef
    );
  }

  return (
    <Stack direction="column" spacing={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="start"
        py={2}
        pr={1}
      >
        <Stack direction="row" spacing={2}>
          <TrackImage width={120} imageUrl={selectedFaceS3SignedUrl} />
          {selectedFaceManageElement}
        </Stack>
        <GoBackButton
          onClick={() => {
            setFaceClips([]);
            onCloseClick();
          }}
        >
          <Typography variant="body2"> Go Back</Typography>
        </GoBackButton>
      </Stack>
      <SearchFilter
        handleFilterUpdate={(params) => {
          return handleSearchChange(
            params,
            fetchFaceOccurrences,
            setLoading,
            setNotificationData
          );
        }}
        maxDurationBetweenSearchStartAndEndTime={Duration.fromObject({
          days: 20,
        })}
      />

      {isDefined(faceClips) && !loading ? (
        <Box p={1}>
          <FaceClipsGrid
            clips={faceClips}
            displayCameraName={true}
            displayDate={true}
          />
        </Box>
      ) : (
        <Box p={12} justifyContent="center" alignItems="center" display="flex">
          <CircularProgress size={45} color="secondary" />
        </Box>
      )}
    </Stack>
  );
}
