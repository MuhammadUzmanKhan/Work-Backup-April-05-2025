import { CandidateCamera, CandidateCredentials, getCredentials } from "./types";

export function updateCandidateCamera(
  prev: CandidateCamera[],
  macAddress: string,
  updateFunction: (candidate: CandidateCamera) => CandidateCamera
): CandidateCamera[] {
  return prev.map((candidate) => {
    if (candidate.data.mac_address === macAddress) {
      return updateFunction(candidate);
    }
    return candidate;
  });
}

export function updateCandidateCamerasArray(
  prevCameras: CandidateCamera[],
  macAddress: string,
  updateCallback: (candidate: CandidateCamera) => CandidateCamera
): CandidateCamera[] {
  return prevCameras.map((candidate) => {
    if (candidate.data.mac_address === macAddress) {
      return updateCallback(candidate);
    }
    return candidate;
  });
}
export function updateCandidateCameraCredentials(
  candidate: CandidateCamera,
  credentials: CandidateCredentials
): CandidateCamera {
  return {
    ...candidate,
    data: {
      ...candidate.data,
      ...getCredentials({
        username: candidate.data.username,
        password: candidate.data.password,
        defaults: credentials,
        useDefault: candidate.selected,
      }),
    },
  };
}

export function onNewDefaultsCredentials(
  credentials: CandidateCredentials,
  setDefaultCredentials: React.Dispatch<
    React.SetStateAction<CandidateCredentials>
  >,
  setCandidateCameras: React.Dispatch<React.SetStateAction<CandidateCamera[]>>
) {
  setDefaultCredentials(credentials);
  setCandidateCameras((prev) =>
    prev.map((camera) => updateCandidateCameraCredentials(camera, credentials))
  );
}

export function onCameraToggle(
  macAddress: string,
  defaultCredentials: CandidateCredentials,
  setCandidateCameras: React.Dispatch<React.SetStateAction<CandidateCamera[]>>
) {
  setCandidateCameras((prev) =>
    updateCandidateCamerasArray(prev, macAddress, (candidate) => {
      const selected = !candidate.selected;
      return {
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
      };
    })
  );
}

export function onCameraPasswordChange(
  macAddress: string,
  password: string,
  setCandidateCameras: React.Dispatch<React.SetStateAction<CandidateCamera[]>>
) {
  setCandidateCameras((prev) =>
    updateCandidateCamera(prev, macAddress, (candidate) => ({
      ...candidate,
      data: {
        ...candidate.data,
        password,
      },
    }))
  );
}

export function onCameraUsernameChange(
  macAddress: string,
  username: string,
  setCandidateCameras: React.Dispatch<React.SetStateAction<CandidateCamera[]>>
) {
  setCandidateCameras((prev) =>
    updateCandidateCamera(prev, macAddress, (candidate) => ({
      ...candidate,
      data: {
        ...candidate.data,
        username,
      },
    }))
  );
}
