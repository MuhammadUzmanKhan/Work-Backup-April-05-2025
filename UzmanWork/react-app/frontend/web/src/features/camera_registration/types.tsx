import { CandidateCameraData, isDefined } from "coram-common-utils";

export interface CandidateCamera {
  data: CandidateCameraData;
  selected: boolean;
  idx: number;
}

export interface CandidateCredentials {
  username?: string;
  password?: string;
}

export function getCredentials({
  username,
  password,
  defaults,
  useDefault,
}: {
  username?: string;
  password?: string;
  defaults: CandidateCredentials;
  useDefault: boolean;
}): CandidateCredentials {
  return {
    // Use default if it's defined, persist user's entered value if present in the field
    username:
      useDefault &&
      isDefined(defaults.username) &&
      (!isDefined(username) || username === "")
        ? defaults.username
        : username,
    password:
      useDefault &&
      isDefined(defaults.password) &&
      (!isDefined(password) || password === "")
        ? defaults.password
        : password,
  };
}
