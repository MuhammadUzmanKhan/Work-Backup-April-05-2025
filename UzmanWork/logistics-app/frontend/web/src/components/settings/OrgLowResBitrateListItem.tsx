import { Organization, OrganizationsService } from "coram-common-utils";
import { OrgFieldListItem } from "./OrgFieldListItem";
import {
  FieldOption,
  useOrgFieldCallback,
  useOrgFieldUpdate,
} from "hooks/org_field_update";
import { SpeedOutlined as SpeedOutlinedIcon } from "@mui/icons-material";
import { MenuItem, Typography } from "@mui/material";
import { StyledSelect } from "components/styled_components/StyledSelect";

const BITRATE_OPTIONS: FieldOption<number>[] = [
  {
    value: 128,
    label: "128 kbps",
  },
  {
    value: 256,
    label: "256 kbps",
  },
  {
    value: 512,
    label: "512 kbps",
  },
  {
    value: 1024,
    label: "1 Mbps",
  },
];

interface OrgLowResBitrateProps {
  organization: Organization;
  refetch: () => void;
}

export function OrgLowResBitrateListItem({
  organization,
  refetch,
}: OrgLowResBitrateProps) {
  const { orgField, setOrgField, extendedFieldOptions } = useOrgFieldUpdate(
    organization.low_res_bitrate_kbps,
    BITRATE_OPTIONS,
    (value: number) => `${value} kbps`
  );

  const { isLoading, handleInputChange } = useOrgFieldCallback(
    async (low_res_bitrate_kbps: number) => {
      await OrganizationsService.updateLowResBitrate({
        tenant: organization.tenant,
        low_res_bitrate_kbps: low_res_bitrate_kbps,
      });
    },
    "Failed to update the low resolution bitrate.",
    "The low resolution bitrate has been successfully updated for all streams for this org.",
    refetch
  );

  return (
    <OrgFieldListItem
      disabled={orgField === organization.low_res_bitrate_kbps || isLoading}
      primaryText={
        <Typography variant="h2">
          Set per-camera bitrate for video wall
        </Typography>
      }
      secondaryText={
        "This setting adjusts the bitrate for each camera stream displayed on a video wall, which includes Live View, Personal Wall, and Kiosk modes. The adjustment is made at the organization level and applies to all cameras within the organization. If you need to view multiple cameras from the same location on a video wall, configuring a lower bitrate can reduce the uplink bandwidth necessary for streaming the cameras."
      }
      Icon={SpeedOutlinedIcon}
      confirmProps={{
        confirmText:
          "Changing the organization low resolution bitrate setting will update the low resolution bitrate for all streams of this org.",
        yesText: "Yes, apply the new bitrate setting",
        noText: "No, keep the current bitrate setting",
      }}
      onButtonClick={async () => await handleInputChange(orgField)}
      actionComponent={
        <StyledSelect
          value={orgField}
          disabled={isLoading}
          onChange={(event) => {
            const newFieldOption = extendedFieldOptions.find(
              (option) => option.value === (event.target.value as number)
            ) as FieldOption<number>;
            setOrgField(newFieldOption.value);
          }}
        >
          {extendedFieldOptions.map((option) => (
            <MenuItem key={option.label} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </StyledSelect>
      }
    />
  );
}
