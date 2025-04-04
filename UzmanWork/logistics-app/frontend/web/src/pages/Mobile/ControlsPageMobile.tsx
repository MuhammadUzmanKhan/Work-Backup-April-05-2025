import { useOrganizationContext } from "coram-common-utils";
import { Box, Divider, List } from "@mui/material";
import { useIsAdmin } from "components/layout/RoleGuards";
import { ORG_FLAG_LIST_ITEMS } from "utils/organization_flag_items";
import { Fragment } from "react";
import { OrgFlagListItem } from "components/settings/OrgFlagListItem";
import { OrgLowResBitrateListItem } from "components/settings/OrgLowResBitrateListItem";
import { OrgAudioSettingsListItem } from "components/settings/OrgAudioSettingsListItem";
import { OrgWebRTCSettingsListItem } from "components/settings/OrgWebrtcSettingsListItem";

export function ControlsPageMobile() {
  const { organization, refetchOrganizations } = useOrganizationContext();
  const isAdmin = useIsAdmin();

  return (
    <Box width="100vw" p={2}>
      <List>
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
      </List>
    </Box>
  );
}
