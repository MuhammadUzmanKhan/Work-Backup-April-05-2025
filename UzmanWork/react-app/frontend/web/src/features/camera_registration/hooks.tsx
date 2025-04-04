import {
  CamerasRegistrationService,
  CandidateCamerasResponse,
  Location,
  RegisterCandidateCamerasResponse,
  isDefined,
} from "coram-common-utils";
import { Duration } from "luxon";
import { useMutation, useQuery } from "react-query";
import { CandidateCamera } from "./types";
import { useEffect, useState } from "react";

const FETCH_CANDIDATE_CAMERAS_INTERVAL = Duration.fromObject({ seconds: 5 });

const EMPTY_RESPONSE: CandidateCamerasResponse = {
  unavailable_nvr_uuids: [],
  candidate_cameras_data: [],
  candidate_nvrs_data: [],
};

export function useFetchCandidateCameras(locationId?: number) {
  const query = useQuery(
    ["candidate_cameras", locationId],
    async () => {
      if (!isDefined(locationId)) return;
      return await CamerasRegistrationService.listCandidateCameras(locationId);
    },
    {
      enabled: isDefined(locationId),
      refetchInterval: FETCH_CANDIDATE_CAMERAS_INTERVAL.as("milliseconds"),
    }
  );

  return {
    ...query,
    data: isDefined(query.data) ? query.data : EMPTY_RESPONSE,
  };
}

export function useRegisterCandidateCameras({
  onSuccess,
  onError,
}: {
  onSuccess: (data: RegisterCandidateCamerasResponse) => void;
  onError: (err: unknown) => void;
}) {
  return useMutation(
    async ({
      candidateCameras,
      selectedLocation,
    }: {
      candidateCameras: CandidateCamera[];
      selectedLocation: Location;
    }) => {
      const candidateCamerasData = candidateCameras
        .filter((camera) => camera.selected)
        .map((camera) => camera.data);
      return await CamerasRegistrationService.registerCandidates(
        selectedLocation.id,
        {
          candidate_cameras_data: candidateCamerasData,
        }
      );
    },
    {
      onError: onError,
      onSuccess: onSuccess,
    }
  );
}

export function useIntegrateCandidatesResponse({
  candidatesResponse,
}: {
  candidatesResponse: CandidateCamerasResponse;
}) {
  const [numTotalSlots, setNumTotalSlots] = useState<number>(0);
  const [candidateCameras, setCandidateCameras] = useState<CandidateCamera[]>(
    []
  );

  useEffect(() => {
    if (candidatesResponse.unavailable_nvr_uuids.length > 0) {
      console.debug(
        `unavailable NVRs: ${candidatesResponse.unavailable_nvr_uuids}`
      );
    }

    setNumTotalSlots(
      candidatesResponse.candidate_nvrs_data
        .map((nvr) => nvr.num_available_slots)
        .reduce((a, b) => a + b, 0)
    );
    // integrate backend data in local state
    setCandidateCameras((previous) => {
      const candidateCameras = [...previous];
      const previousMacAddresses = new Set(
        previous.map((camera) => camera.data.mac_address)
      );
      // add cameras that are not already in the local state
      candidatesResponse.candidate_cameras_data.forEach((cameraData) => {
        if (!previousMacAddresses.has(cameraData.mac_address)) {
          candidateCameras.push({
            data: cameraData,
            selected: false,
            // idx is 0-indexed, but we want to display 1-indexed
            idx: candidateCameras.length + 1,
          });
        }
      });
      return candidateCameras;
    });
  }, [candidatesResponse]);

  return { numTotalSlots, candidateCameras, setCandidateCameras };
}
