import {
  OrgCamerasWebRTCSettings,
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
import { StyledSelect } from "components/styled_components/StyledSelect";
import { StreamOutlined as StreamOutlinedIcon } from "@mui/icons-material";

const WEBRTC_OPTIONS: FieldOption<OrgCamerasWebRTCSettings>[] = [
  {
    value: OrgCamerasWebRTCSettings.ENABLED,
    label: "Enable webRTC for all cameras",
  },
  {
    value: OrgCamerasWebRTCSettings.DISABLED,
    label: "Disable webRTC for all cameras",
  },
  {
    value: OrgCamerasWebRTCSettings.MANUAL,
    label: "Manually set WebRTC for each cameras",
  },
];

interface OrgWebRTCSettingsListItemProps {
  organization: Organization;
  refetch: () => void;
}

export function OrgWebRTCSettingsListItem({
  organization,
  refetch,
}: OrgWebRTCSettingsListItemProps) {
  const { orgField, setOrgField, extendedFieldOptions } = useOrgFieldUpdate(
    organization.cameras_webrtc_settings,
    WEBRTC_OPTIONS,
    (value: OrgCamerasWebRTCSettings) => `Unknown webRTC setting: ${value}`
  );

  const { isLoading, handleInputChange } = useOrgFieldCallback(
    async (value: OrgCamerasWebRTCSettings) => {
      await OrganizationsService.updateWebrtcSettings({
        webrtc_settings: value,
      });
    },
    "Failed to update the webRTC setting.",
    "The webRTC setting has been successfully updated for all streams for this org.",
    refetch
  );

  return (
    <OrgFieldListItem
      primaryText={
        <Typography variant="h2">Enable WebRTC Streaming</Typography>
      }
      secondaryText={
        "Enables real-time WebRTC streaming for the selected cameras. The video stream on the timeline page, personal wall, and mobile will be streamed in real-time. The video feed on the Live View and Kiosk will not use WebRTC."
      }
      Icon={StreamOutlinedIcon}
      confirmProps={{
        confirmText:
          "Changing the webRTC setting will update the value for all streams of this org.",
        yesText: "Yes, apply the new webRTC setting",
        noText: "No, keep the current webRTC setting",
      }}
      disabled={orgField === organization.cameras_webrtc_settings || isLoading}
      actionComponent={
        <StyledSelect
          value={orgField}
          disabled={isLoading}
          onChange={(event) => {
            const newFieldOption = extendedFieldOptions.find(
              (option) =>
                option.value ===
                (event.target.value as OrgCamerasWebRTCSettings)
            ) as FieldOption<OrgCamerasWebRTCSettings>;
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
