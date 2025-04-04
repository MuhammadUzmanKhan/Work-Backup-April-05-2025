import { CircularProgress, Divider, Stack } from "@mui/material";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import { useContext, useState } from "react";
import Grid from "@mui/material/Unstable_Grid2";

import { isDefined, Location, useLocations } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";

import { matchAtLeastOne } from "utils/search_filter";
import { mapVendor } from "utils/camera_vendors";
import {
  BeforeSearchPlaceholderMobile,
  Footer,
  RegistrationDetails,
} from "./CameraRegistrationModal/components";
import { CandidateCredentials } from "./types";
import { CameraRegistrationItemMobile } from "components/devices/Mobile/CameraRegistrationItemMobile";
import {
  useFetchCandidateCameras,
  useIntegrateCandidatesResponse,
  useRegisterCandidateCameras,
} from "./hooks";
import { SearchInput } from "components/devices/SearchInput";
import { LocationSelector } from "./CameraRegistrationModal/components/LocationSelector";
import {
  onCameraPasswordChange,
  onCameraToggle,
  onCameraUsernameChange,
  onNewDefaultsCredentials,
} from "./utils";
import { NoResultFoundPlaceholder } from "components/common";

export function CameraRegistrationPageMobile() {
  const { setNotificationData } = useContext(NotificationContext);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data: locations } = useLocations();
  const [defaultCredentials, setDefaultCredentials] =
    useState<CandidateCredentials>({});
  const [selectedLocation, setSelectedLocation] = useState<Location>();

  const { data: candidatesResponse, isLoading: isLoadingCandidates } =
    useFetchCandidateCameras(selectedLocation?.id);

  const { numTotalSlots, candidateCameras, setCandidateCameras } =
    useIntegrateCandidatesResponse({ candidatesResponse });

  const { isLoading, mutateAsync: registerCandidateCameras } =
    useRegisterCandidateCameras({
      onSuccess: (data) => {
        const assignedSet = new Set(
          data.successful_assignments.map(
            (assignment) => assignment.camera_data.mac_address
          )
        );

        if (data.failed_assignments.length > 0) {
          setNotificationData({
            severity: "warning",
            message: `Some cameras could not be registered. Please try again.`,
          });
        } else {
          setNotificationData({
            severity: "success",
            message: `Successfully registered ${data.successful_assignments.length} cameras`,
          });
        }
        setCandidateCameras(
          candidateCameras.filter(
            (camera) => !assignedSet.has(camera.data.mac_address)
          )
        );
      },
      onError: (err) => {
        console.error(err);
        setNotificationData({
          severity: "error",
          message: "An unexpected error occurred.",
        });
      },
    });

  async function onActivateClick() {
    if (!isDefined(selectedLocation)) {
      return;
    }
    await registerCandidateCameras({
      candidateCameras: candidateCameras.filter((camera) => camera.selected),
      selectedLocation,
    });
  }

  const filteredCandidates = candidateCameras.filter((camera) => {
    if (searchQuery === "") return true;
    return matchAtLeastOne(searchQuery, [
      camera.data.mac_address,
      camera.data.ip,
      mapVendor(camera.data.vendor),
    ]);
  });

  const hasCandidateCameras = candidateCameras.length > 0;

  return (
    <Stack
      gap={2}
      minHeight="90vh"
      px={1}
      py={1}
      justifyContent="space-between"
    >
      <Grid container spacing={2} alignItems="start">
        <Grid xs={12}>
          <LocationSelector
            locations={locations}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            onLocationSelected={() => setCandidateCameras([])}
            fullWidth={true}
          />
        </Grid>
        <Grid xs={12}>
          {hasCandidateCameras && (
            <RegistrationDetails
              numCandidates={candidateCameras.length}
              defaultCredentials={defaultCredentials}
              onSubmit={(credentials: CandidateCredentials) =>
                onNewDefaultsCredentials(
                  credentials,
                  setDefaultCredentials,
                  setCandidateCameras
                )
              }
            />
          )}
        </Grid>
        <Grid xs={12}>
          {isDefined(selectedLocation) && candidateCameras.length > 0 && (
            <SearchInput
              placeHolder="Search"
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              sx={{ maxHeight: "34px" }}
            />
          )}
        </Grid>

        <Grid xs={12}>
          <AbsolutelyCentered>
            {isDefined(selectedLocation) && isLoadingCandidates && (
              <CircularProgress color="secondary" />
            )}
            {!isDefined(selectedLocation) && <BeforeSearchPlaceholderMobile />}
            {isDefined(selectedLocation) &&
              !isLoadingCandidates &&
              candidateCameras.length === 0 && (
                <NoResultFoundPlaceholder text="No new cameras found" />
              )}
          </AbsolutelyCentered>
        </Grid>
        <Grid xs={12}>
          {isDefined(selectedLocation) &&
            candidateCameras.length > 0 &&
            filteredCandidates.map((candidate) => (
              <CameraRegistrationItemMobile
                key={candidate.data.mac_address}
                candidate={candidate}
                onCameraToggle={(macAddress: string) =>
                  onCameraToggle(
                    macAddress,
                    defaultCredentials,
                    setCandidateCameras
                  )
                }
                onCameraUsernameChange={(
                  macAddress: string,
                  username: string
                ) =>
                  onCameraUsernameChange(
                    macAddress,
                    username,
                    setCandidateCameras
                  )
                }
                onCameraPasswordChange={(
                  macAddress: string,
                  password: string
                ) =>
                  onCameraPasswordChange(
                    macAddress,
                    password,
                    setCandidateCameras
                  )
                }
              />
            ))}
        </Grid>
      </Grid>
      <Stack gap={2}>
        <Divider />
        <Footer
          candidateCameras={candidateCameras}
          numTotalSlots={numTotalSlots}
          onActivateClick={onActivateClick}
          disabled={
            candidateCameras.length === 0 || !isDefined(selectedLocation)
          }
          isRegistrationInProgress={isLoading}
        />
      </Stack>
    </Stack>
  );
}
