import { Divider, List, Stack } from "@mui/material";
import { FeatureFlags, useOrganizationContext } from "coram-common-utils";
import { useIsAdmin } from "components/layout/RoleGuards";
import { useFeatureEnabled } from "utils/globals";
import { OrgFlagListItem } from "./OrgFlagListItem";
import { ORG_FLAG_LIST_ITEMS } from "utils/organization_flag_items";
import { Fragment } from "react";
import { OrgLowResBitrateListItem } from "./OrgLowResBitrateListItem";
import { OrgAudioSettingsListItem } from "./OrgAudioSettingsListItem";
import { OrgNumberLicensedCamerasListItem } from "./OrgNumberLicensedCamerasListItem";
import { NetworkScanSettingsListItem } from "./NetworkScanSettings/NetworksScanSettingsListItem";
import { OrgWebRTCSettingsListItem } from "./OrgWebrtcSettingsListItem";

// TODO (luca): Dedup this against the mobile version
export function ControlsTab() {
  const { organization, refetchOrganizations } = useOrganizationContext();
  const isAdmin = useIsAdmin();
  const orgLicensedCamerasControlEnabled = useFeatureEnabled(
    FeatureFlags.ORG_LICENSED_CAMERAS_CONTROL_ENABLED
  );
  return (
    <Stack padding={3}>
      <List
        sx={{
          width: "100%",
          bgcolor: "background.paper",
        }}
      >
        {ORG_FLAG_LIST_ITEMS.map((item) => (
          <Fragment key={item.flagEnum}>
            <OrgFlagListItem
              key={item.flagEnum}
              flagEnum={item.flagEnum}
              Icon={item.Icon}
              primaryText={item.primaryText}
              secondaryText={item.secondaryText}
            />
            <Divider variant="fullWidth" component="li" />
          </Fragment>
        ))}
        {isAdmin && (
          <OrgAudioSettingsListItem
            organization={organization}
            refetch={refetchOrganizations}
          />
        )}
        {isAdmin && (
          <OrgWebRTCSettingsListItem
            organization={organization}
            refetch={refetchOrganizations}
          />
        )}
        {isAdmin && (
          <OrgLowResBitrateListItem
            organization={organization}
            refetch={refetchOrganizations}
          />
        )}

        {isAdmin && orgLicensedCamerasControlEnabled && (
          <OrgNumberLicensedCamerasListItem />
        )}
        {isAdmin && <NetworkScanSettingsListItem />}
      </List>
    </Stack>
  );
}
