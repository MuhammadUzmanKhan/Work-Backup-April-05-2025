import { ExposedOrgFlags, OrgFlagsService } from "coram-common-utils";
import { GenericSwitch } from "components/devices/cameras_table_cells/GenericSwitch";
import { useOrgFlag } from "hooks/org_features";

interface OrgFlagSwitchProps {
  flagEnum: ExposedOrgFlags;
}

export function OrgFlagSwitch({ flagEnum }: OrgFlagSwitchProps) {
  const { data: active, isLoading, refetch } = useOrgFlag(flagEnum);

  return (
    <GenericSwitch
      disabled={isLoading}
      callback={async (flagValue) => {
        await OrgFlagsService.updateOrgFlag({
          flag_enum: flagEnum,
          flag_value: flagValue,
        });
      }}
      onSuccessfulUpdate={refetch}
      value={active}
    />
  );
}
