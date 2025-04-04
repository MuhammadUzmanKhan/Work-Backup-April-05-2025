import {
  ExposedOrgFlags,
  OrganizationsService,
  OrgFlagsService,
  isDefined,
} from "coram-common-utils";
import { useQuery } from "react-query";

export function useOrgFlag(flagEnum: ExposedOrgFlags) {
  const query = useQuery(
    ["orgFlag", flagEnum],
    async () => await OrgFlagsService.getOrgFlag(flagEnum),
    {
      refetchOnWindowFocus: false,
    }
  );
  return {
    ...query,
    data: query.data ?? false,
  };
}

export function useOrgNumberLicensedCameras() {
  const query = useQuery(
    "orgNumberLicensedCameras",
    async () => {
      const data = await OrganizationsService.retrieveNumberLicensedCameras();
      return isDefined(data.number_licensed_cameras)
        ? data.number_licensed_cameras
        : null;
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  return query;
}
