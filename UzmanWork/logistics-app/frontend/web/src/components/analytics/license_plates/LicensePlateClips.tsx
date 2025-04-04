import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { ClipData, ClipsGrid } from "components/timeline/ClipsGrid";
import { DateTime, Duration } from "luxon";
import { LicensePlateImage } from "./LicensePlateImage";
import { useContext, useRef, useState } from "react";
import { VehicleImage } from "./VehicleImage";
import { useLicensePlateAlertProfileExists } from "utils/globals";
import { LicensePlateProfileCreator } from "./LicensePlateProfileCreator";
import {
  CameraResponse,
  CancelablePromise,
  LicensePlateOccurrencesResponse,
  LicensePlateResponse,
  LicensePlateService,
  isDefined,
} from "coram-common-utils";
import {
  SearchCbParams,
  SearchFilter,
} from "components/common/search_filter/SearchFilter";
import { NotificationContext } from "contexts/notification_context";
import { handleSearchChange } from "components/common/search_filter/utils";
import { handleLicensePlateOccurrencesUpdate } from "./utils";
import { DetectionAggregatedInterval } from "utils/detection_aggregation";
import { GoBackButton } from "components/styled_components/StyledButton";

const LicensePlateDetail = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <Typography variant="body2">
    <span style={{ color: "grey" }}>{label}: </span>
    {value}
  </Typography>
);

interface LicensePlateClipsProps {
  cameras: CameraResponse[];
  selectedLicensePlate: LicensePlateResponse;
  setSelectedLicensePlate: (
    licensePlate: LicensePlateResponse | undefined
  ) => void;
}

export function LicensePlateClips({
  cameras,
  selectedLicensePlate,
  setSelectedLicensePlate,
}: LicensePlateClipsProps) {
  const [clips, setClips] = useState<ClipData[]>([]);
  const licensePlate = selectedLicensePlate.license_plate;
  const [loading, setLoading] = useState<boolean>(false);
  const { setNotificationData } = useContext(NotificationContext);
  const licensePlateRequestRef = useRef<CancelablePromise<
    Array<LicensePlateOccurrencesResponse>
  > | null>(null);

  const {
    data: hasProfile,
    isFetchedAfterMount: isProfileFetched,
    refetch: refetchProfile,
  } = useLicensePlateAlertProfileExists(licensePlate.license_plate_number);

  async function fetchFaceOccurrences(params: SearchCbParams) {
    await handleLicensePlateOccurrencesUpdate(
      cameras,
      () => {
        return LicensePlateService.retrieveLicensePlateOccurrences({
          start_time: params.startTime,
          end_time: params.endTime,
          license_plate_number: licensePlate.license_plate_number,
          mac_addresses: params.macAddresses,
          location_ids: params.locationIds,
        });
      },
      (clips: DetectionAggregatedInterval[]) => setClips(clips),
      licensePlateRequestRef
    );
  }

  if (!isProfileFetched)
    return (
      <Box p={12} justifyContent="center" alignItems="center" display="flex">
        <CircularProgress size={45} color="secondary" />
      </Box>
    );

  return (
    <Stack direction="column" spacing={2}>
      <Stack direction="row" justifyContent="space-between">
        <Stack direction="row" spacing={2}>
          <Stack direction="column" spacing={"1px"}>
            <LicensePlateImage
              boxWidth={150}
              boxHeight={75}
              licensePlateData={selectedLicensePlate}
            />
            <VehicleImage
              src={selectedLicensePlate.s3_signed_url}
              style={{ width: "150px", height: "75px" }}
            />
          </Stack>
          <Stack direction="column" spacing={"8px"}>
            <LicensePlateDetail
              label="Vehicle Number"
              value={licensePlate.license_plate_number}
            />
            <LicensePlateDetail
              label="Last Seen"
              value={DateTime.fromISO(licensePlate.last_seen).toLocaleString(
                DateTime.DATETIME_MED
              )}
            />
            <LicensePlateDetail
              label="Sightings"
              value={selectedLicensePlate.license_plate.num_occurrences.toString()}
            />
            {selectedLicensePlate.license_plate.location_name && (
              <LicensePlateDetail
                label="Location"
                value={selectedLicensePlate.license_plate.location_name}
              />
            )}
            {!hasProfile && (
              <LicensePlateProfileCreator
                licensePlateNumber={licensePlate.license_plate_number}
                refetchProfile={refetchProfile}
              />
            )}
          </Stack>
        </Stack>
        <GoBackButton
          onClick={() => {
            setSelectedLicensePlate(undefined);
          }}
        >
          <Typography variant="body2"> Go Back</Typography>
        </GoBackButton>
      </Stack>
      <Box paddingTop={1}>
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
            months: 2,
          })}
        />
      </Box>
      {isDefined(clips) && !loading ? (
        <Box>
          <ClipsGrid
            clips={clips}
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
