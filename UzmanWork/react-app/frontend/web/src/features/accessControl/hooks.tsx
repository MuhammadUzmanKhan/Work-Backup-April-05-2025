import { AccessControlService } from "coram-common-utils";
import { useQuery } from "react-query";
import { parseAccessControlPoint } from "./types";

export function useAccessControlIntegrations() {
  const query = useQuery(["retrieve_access_control_integrations"], async () =>
    AccessControlService.listIntegrations()
  );
  return { ...query, data: query.data ?? [] };
}

export function useAccessControlPoints() {
  const query = useQuery(["retrieve_access_control_points"], async () => {
    const accessControlPoints = await AccessControlService.listAccessPoints();
    return accessControlPoints.map(parseAccessControlPoint);
  });
  return { ...query, data: query.data ?? [] };
}
