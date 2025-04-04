import { Stack } from "@mui/material";
import { useRef, useState } from "react";
import { TABS } from "../SettingsPage";
import { BottomNavBar } from "components/mobile_footer/BottomNavBar";
import { SettingsMenuItemMobile } from "components/settings/mobile/SettingsMenuItemMobile";
import { OrganizationSelectorMobile } from "components/settings/mobile/OrganizationSelectorMobile";
import { useNavigate } from "react-router-dom";
import { UserCardMobile } from "components/UserCardMobile";
import {
  KeyboardControlKey as KeyboardControlKeyIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { AdminUserRequired } from "components/layout/RoleGuards";
import {
  useOrganizationContext,
  useSelectedOrganization,
} from "coram-common-utils";
import {
  getOrganizationIdInStorage,
  setOrganizationIdInStorage,
} from "utils/local_storage";

export function SettingsPageMobile() {
  const [orgSelectorOpen, setOrgSelectorOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<TABS | null>(null);
  const anchorEl = useRef<HTMLDivElement>(null);
  const { organization } = useOrganizationContext();
  const { organizations, setOrganization } = useSelectedOrganization({
    setOrganizationIdInStorage,
    getOrganizationIdInStorage,
  });
  const navigate = useNavigate();

  function getIcon(title: string) {
    if (title === selectedMenuItem) {
      return <KeyboardControlKeyIcon />;
    } else if (title.toLocaleUpperCase() === TABS.ORGANIZATIONS) {
      return <KeyboardArrowDownIcon />;
    } else {
      return <ChevronRightIcon />;
    }
  }

  return (
    <Stack p={2} minHeight="fill-available" width="100vw" bgcolor="white">
      <UserCardMobile />
      <SettingsMenuItemMobile
        title={"Organizations"}
        icon={getIcon(TABS.ORGANIZATIONS)}
        secondaryText={organization.name}
        ref={anchorEl}
        onClick={() => {
          setOrgSelectorOpen(true);
          setSelectedMenuItem(TABS.ORGANIZATIONS);
        }}
      />
      <OrganizationSelectorMobile
        open={orgSelectorOpen}
        menuRef={anchorEl.current}
        organizations={organizations}
        onClose={() => {
          setOrgSelectorOpen(false);
          setSelectedMenuItem(null);
        }}
        onChange={(org) => {
          setOrganization(org);
          setSelectedMenuItem(null);
          setOrgSelectorOpen(false);
        }}
      />
      <AdminUserRequired>
        <SettingsMenuItemMobile
          title="Members"
          icon={getIcon(TABS.MEMBERS)}
          onClick={() => navigate("/members")}
        />
      </AdminUserRequired>
      <SettingsMenuItemMobile
        title="Profile"
        icon={getIcon(TABS.PROFILE)}
        onClick={() => navigate("/profile")}
      />
      <AdminUserRequired>
        <SettingsMenuItemMobile
          title="Notification"
          icon={getIcon(TABS.NOTIFICATION)}
          onClick={() => navigate("/notifications")}
        />
      </AdminUserRequired>
      <AdminUserRequired>
        <SettingsMenuItemMobile
          title="Controls"
          icon={getIcon(TABS.CONTROLS)}
          onClick={() => navigate("/controls")}
        />
      </AdminUserRequired>
      <BottomNavBar />
    </Stack>
  );
}
