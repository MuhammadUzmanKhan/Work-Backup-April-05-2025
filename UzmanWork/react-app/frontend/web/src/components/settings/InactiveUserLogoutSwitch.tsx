import {
  OrganizationsService,
  useOrganizationContext,
} from "coram-common-utils";
import { GenericSwitch } from "components/devices/cameras_table_cells/GenericSwitch";

export function InactiveUserLogoutSwitch() {
  const { organization, refetchOrganizations } = useOrganizationContext();
  return (
    <GenericSwitch
      disabled={false}
      callback={async (inactive_user_logout_enabled) => {
        await OrganizationsService.updateInactiveUserLogout({
          inactive_user_logout_enabled,
        });
      }}
      onSuccessfulUpdate={refetchOrganizations}
      value={organization.inactive_user_logout_enabled}
    />
  );
}
