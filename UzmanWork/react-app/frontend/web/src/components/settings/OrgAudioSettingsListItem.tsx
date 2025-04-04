import {
  OrgCamerasAudioSettings,
  Organization,
  OrganizationsService,
} from "coram-common-utils";
import { OrgFieldListItem } from "./OrgFieldListItem";
import {
  FieldOption,
  useOrgFieldCallback,
  useOrgFieldUpdate,
} from "hooks/org_field_update";
import { MenuItem, Typography } from "@mui/material";
import { VolumeUp as AudioIcon } from "@mui/icons-material";
import { StyledSelect } from "components/styled_components/StyledSelect";

const AUDIO_OPTIONS: FieldOption<OrgCamerasAudioSettings>[] = [
  {
    value: OrgCamerasAudioSettings.ENABLED,
    label: "Enable audio for all cameras",
  },
  {
    value: OrgCamerasAudioSettings.DISABLED,
    label: "Disable audio for all cameras",
  },
  {
    value: OrgCamerasAudioSettings.MANUAL,
    label: "Manually set audio for each cameras",
  },
];

interface OrgAudioSettingsListItemProps {
  organization: Organization;
  refetch: () => void;
}

export function OrgAudioSettingsListItem({
  organization,
  refetch,
}: OrgAudioSettingsListItemProps) {
  const { orgField, setOrgField, extendedFieldOptions } = useOrgFieldUpdate(
    organization.cameras_audio_settings,
    AUDIO_OPTIONS,
    (value: OrgCamerasAudioSettings) => `Unknown audio setting: ${value}`
  );

  const { isLoading, handleInputChange } = useOrgFieldCallback(
    async (value: OrgCamerasAudioSettings) => {
      await OrganizationsService.updateAudioSettings({
        audio_settings: value,
      });
    },
    "Failed to update the audio setting.",
    "The audio setting has been successfully updated for all streams for this org.",
    refetch
  );

  return (
    <OrgFieldListItem
      primaryText={<Typography variant="h2">Enable Audio Streaming</Typography>}
      secondaryText={
        "Activate audio streaming for the cameras, granting you the ability to independently manage audio for each camera. Keep in mind that for this feature to function, the camera must support audio and have audio streaming enabled within its settings."
      }
      Icon={AudioIcon}
      confirmProps={{
        confirmText:
          "Changing the audio setting will update the value for all streams of this org.",
        yesText: "Yes, apply the new audio setting",
        noText: "No, keep the current audio setting",
      }}
      disabled={orgField === organization.cameras_audio_settings || isLoading}
      actionComponent={
        <StyledSelect
          value={orgField}
          disabled={isLoading}
          onChange={(event) => {
            const newFieldOption = extendedFieldOptions.find(
              (option) =>
                option.value === (event.target.value as OrgCamerasAudioSettings)
            ) as FieldOption<OrgCamerasAudioSettings>;
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
      onButtonClick={async () => await handleInputChange(orgField)}
    />
  );
}
