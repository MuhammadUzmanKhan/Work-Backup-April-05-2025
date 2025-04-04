import { Button, Stack, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { AdminUserRequired, useIsAdmin } from "components/layout/RoleGuards";
import { ControlsTab } from "components/settings/ControlsTab";
import { AccessLogsTab } from "features/accessLogs";
import { MembersTab } from "components/settings/MembersTab";
import { NotificationsTab } from "components/settings/NotificationsTab";
import { OrganizationsTab } from "components/settings/OrganizationsTab";
import { ProfileTab } from "components/settings/ProfileTab";
import { useState } from "react";
import { TOOLBAR_HEIGHT_PX } from "components/navbar/navbar";
import { TimezoneTab } from "components/settings/TimezoneTab";
import { useSearchParams } from "utils/search_params";
import { useOrganizations } from "coram-common-utils";

const Item = styled(Button)(({ theme }) => ({
  alignSelf: "stretch",
  width: "100%",
  fontWeight: "normal",
  height: "40px",
  padding: "4px 10px",
  color: theme.palette.common.black,
  borderRadius: "8px",
  justifyContent: "start",
  "&:hover": {
    backgroundColor: theme.palette.neutral
      ? theme.palette.neutral[200]
      : "grey",
  },
}));

export enum TABS {
  MEMBERS = "MEMBERS",
  NOTIFICATION = "NOTIFICATION",
  PROFILE = "PROFILE",
  ORGANIZATIONS = "ORGANIZATIONS",
  CONTROLS = "CONTROLS",
  ACCESS_LOGS = "ACCESS_LOGS",
  TIME_ZONE = "TIME_ZONE",
}

function initializeSelectedTab(options: {
  defaultTab: TABS;
  searchParams: URLSearchParams | undefined;
}): TABS {
  const { defaultTab, searchParams } = options;
  const tabFromSearchParams = searchParams?.get("tab")?.toUpperCase() as TABS;

  if (Object.values(TABS).includes(tabFromSearchParams)) {
    return tabFromSearchParams;
  } else {
    return defaultTab;
  }
}

export function SettingsPage() {
  const isAdmin = useIsAdmin();
  const { searchParams } = useSearchParams();

  const settingsOptions = {
    defaultTab: isAdmin ? TABS.MEMBERS : TABS.PROFILE,
    searchParams,
  };
  const [selectedTab, setSelectedTab] = useState<TABS>(
    initializeSelectedTab(settingsOptions)
  );
  const organizationsQuery = useOrganizations().data;

  const selectedTabStyle = (tab: TABS) => {
    return selectedTab === tab
      ? {
          backgroundColor: "neutral.A100",
          fontWeight: "500 !important",
        }
      : {};
  };

  let contents = <></>;
  switch (selectedTab) {
    case TABS.MEMBERS:
      contents = <MembersTab />;
      break;
    case TABS.NOTIFICATION:
      contents = <NotificationsTab />;
      break;
    case TABS.PROFILE:
      contents = <ProfileTab />;
      break;
    case TABS.ORGANIZATIONS:
      contents = <OrganizationsTab />;
      break;
    case TABS.CONTROLS:
      contents = <ControlsTab />;
      break;
    case TABS.ACCESS_LOGS:
      contents = <AccessLogsTab />;
      break;
    case TABS.TIME_ZONE:
      contents = <TimezoneTab />;
      break;
  }

  return (
    <Grid container sx={{ backgroundColor: "common.white" }}>
      <Grid xs={2} sx={{ minHeight: `calc(100vh - ${TOOLBAR_HEIGHT_PX}px)` }}>
        <Stack spacing={1} sx={{ px: "1rem", pt: "1rem" }}>
          <AdminUserRequired>
            <Item
              sx={selectedTabStyle(TABS.MEMBERS)}
              onClick={() => setSelectedTab(TABS.MEMBERS)}
            >
              Members
            </Item>
          </AdminUserRequired>
          <Item
            sx={selectedTabStyle(TABS.PROFILE)}
            onClick={() => setSelectedTab(TABS.PROFILE)}
          >
            Profile
          </Item>
          <AdminUserRequired>
            <Item
              sx={selectedTabStyle(TABS.NOTIFICATION)}
              onClick={() => setSelectedTab(TABS.NOTIFICATION)}
            >
              Notifications
            </Item>
          </AdminUserRequired>
          {organizationsQuery.size > 1 && (
            <Item
              sx={selectedTabStyle(TABS.ORGANIZATIONS)}
              onClick={() => setSelectedTab(TABS.ORGANIZATIONS)}
            >
              Organizations
            </Item>
          )}
          <AdminUserRequired>
            <Item
              sx={selectedTabStyle(TABS.CONTROLS)}
              onClick={() => setSelectedTab(TABS.CONTROLS)}
            >
              Controls
            </Item>
          </AdminUserRequired>
          <AdminUserRequired>
            <Item
              sx={selectedTabStyle(TABS.ACCESS_LOGS)}
              onClick={() => setSelectedTab(TABS.ACCESS_LOGS)}
            >
              Access Logs
            </Item>
          </AdminUserRequired>
          <AdminUserRequired>
            <Item
              sx={selectedTabStyle(TABS.TIME_ZONE)}
              onClick={() => setSelectedTab(TABS.TIME_ZONE)}
            >
              Timezone
            </Item>
          </AdminUserRequired>
        </Stack>
      </Grid>
      <Grid
        xs={10}
        sx={{ borderLeft: "0.5px solid", borderColor: "neutral.200" }}
      >
        {contents}
      </Grid>
    </Grid>
  );
}
