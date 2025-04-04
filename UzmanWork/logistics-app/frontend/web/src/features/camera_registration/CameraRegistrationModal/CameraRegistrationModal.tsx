import {
  Modal,
  DialogContent,
  Box,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import { useContext, useState } from "react";

import { Location, isDefined, MountIf, useLocations } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { CandidateCredentials, getCredentials } from "../types";
import { CameraRegistrationTable } from "./components/CameraRegistrationTable";
import {
  Footer,
  Header,
  BeforeSearchPlaceholderDesktop,
  LoadingBox,
  RegistrationDetails,
  Controls,
} from "./components";
import { matchAtLeastOne } from "utils/search_filter";
import { mapVendor } from "utils/camera_vendors";
import {
  useFetchCandidateCameras,
  useIntegrateCandidatesResponse,
  useRegisterCandidateCameras,
} from "../hooks";
import { NoResultFoundPlaceholder } from "components/common";

interface CameraRegistrationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onCameraRegistrationSuccess: VoidFunction;
}

export function CameraRegistrationModal({
  open,
  setOpen,
  onCameraRegistrationSuccess,
}: CameraRegistrationModalProps) {
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
        onCameraRegistrationSuccess();
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

  function onNewDefaultsCredentials(credentials: CandidateCredentials) {
    setDefaultCredentials(credentials);
    setCandidateCameras(
      candidateCameras.map((camera) => ({
        ...camera,
        data: {
          ...camera.data,
          ...getCredentials({
            username: camera.data.username,
            password: camera.data.password,
            defaults: credentials,
            useDefault: camera.selected,
          }),
        },
      }))
    );
  }

  function onCameraToggle(macAddress: string) {
    setCandidateCameras(
      candidateCameras.map((candidate) => {
        if (candidate.data.mac_address === macAddress) {
          const selected = !candidate.selected;
          return {
            ...candidate,
            selected: selected,
            data: {
              ...candidate.data,
              ...getCredentials({
                username: candidate.data.username,
                password: candidate.data.password,
                defaults: defaultCredentials,
                useDefault: selected,
              }),
            },
          };
        }
        return candidate;
      })
    );
  }

  function onAllCamerasToggle(selected: boolean) {
    setCandidateCameras(
      candidateCameras.map((candidate) => ({
        ...candidate,
        selected,
        data: {
          ...candidate.data,
          ...getCredentials({
            username: candidate.data.username,
            password: candidate.data.password,
            defaults: defaultCredentials,
            useDefault: selected,
          }),
        },
      }))
    );
  }

  const hasCandidateCameras = candidateCameras.length > 0;
  const filteredCandidates = candidateCameras.filter((camera) => {
    if (searchQuery === "") return true;
    return matchAtLeastOne(searchQuery, [
      camera.data.mac_address,
      camera.data.ip,
      mapVendor(camera.data.vendor),
    ]);
  });

  const padding = 2;

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      sx={{ overflow: "scroll" }}
    >
      <DialogContent>
        <AbsolutelyCentered>
          <Box component={Paper} p={padding} minWidth="75vw" height="85vh">
            <Stack gap={2} height="100%">
              <Header onCloseClick={() => setOpen(false)} />
              <Divider sx={{ mx: -padding }} />
              <Controls
                locations={locations}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onLocationSelected={() => setCandidateCameras([])}
              />

              {hasCandidateCameras && (
                <RegistrationDetails
                  numCandidates={candidateCameras.length}
                  defaultCredentials={defaultCredentials}
                  onSubmit={onNewDefaultsCredentials}
                />
              )}
              <Box flexGrow={1} overflow="hidden">
                <MountIf condition={!isDefined(selectedLocation)}>
                  <BeforeSearchPlaceholderDesktop />
                </MountIf>
                <MountIf condition={isDefined(selectedLocation)}>
                  {isLoadingCandidates ? (
                    <LoadingBox />
                  ) : candidateCameras.length == 0 ? (
                    <AbsolutelyCentered>
                      <NoResultFoundPlaceholder text="No new cameras found" />
                    </AbsolutelyCentered>
                  ) : (
                    <CameraRegistrationTable
                      candidateCameras={filteredCandidates}
                      onCameraToggle={onCameraToggle}
                      onAllCamerasToggle={onAllCamerasToggle}
                      setCandidateCameras={setCandidateCameras}
                    />
                  )}
                </MountIf>
              </Box>
              <Divider sx={{ mx: -padding }} />
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
          </Box>
        </AbsolutelyCentered>
      </DialogContent>
    </Modal>
  );
}
