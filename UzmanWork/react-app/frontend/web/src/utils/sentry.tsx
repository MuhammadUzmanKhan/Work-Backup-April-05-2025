import { useEffect, useRef } from "react";
import { useRecoilValue } from "recoil";
import { selectedOrganization } from "coram-common-utils";
import * as Sentry from "@sentry/react";

export function useSentryTrackTenant() {
  const organization = useRecoilValue(selectedOrganization);
  const prevOrganizationId = useRef(organization?.id);

  // report sentry tenant
  useEffect(() => {
    if (
      organization != null &&
      organization.id !== prevOrganizationId.current
    ) {
      console.info("organisation changed!");
      Sentry.setTag("tenant", organization.tenant);
      Sentry.setTag("tenant_name", organization.name);
      prevOrganizationId.current = organization.id;
    }
  }, [organization]);
}
