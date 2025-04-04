import {
  CameraGroupWithLocations,
  Organization,
  Location,
} from "coram-common-utils";

export type WallParams = {
  cameraGroup: CameraGroupWithLocations | undefined;
  location: Location | undefined;
  organization: Organization;
};
