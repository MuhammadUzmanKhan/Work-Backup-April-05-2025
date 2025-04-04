import React from "react";
import { useTheme } from "@mui/material";
import { FeatureFlags } from "coram-common-utils";
import {
  useIsLimitedUser,
  useIsRegularUser,
} from "components/layout/RoleGuards";
import { DeviceIcon } from "icons/device-icon";
import { LiveIcon } from "icons/live-icon";
import { WallIcon } from "icons/wall-icon";
import { FaceIdIcon } from "icons/face-id";
import { useLocation } from "react-router";
import { useFeatureEnabled } from "utils/globals";
import { KioskIcon } from "icons/kiosk-icon";
import { DashboardIcon } from "icons/dashboard-icon";
import { ScanIcon } from "icons/scan-icon";
import { DiscoverIcon } from "icons/discover-icon";
import { ArchiveIcon } from "icons/archive-icon";
import { AssistantIcon } from "icons/assistant-icon";

interface PageInterface {
  title: string;
  path: string;
  icon: JSX.Element;
}

export enum PathNames {
  LIVE_VIEW = "/live",
  PERSONAL_WALL = "/wall",
  DEVICES = "/devices",
  DISCOVER = "/discover",
  ASSISTANT = "/assistant",
  ARCHIVE = "/archive",
  ANALYTICS = "/analytics",
  KIOSK = "/kiosk",
  INSIGHTS = "/insights",
  ACCESS_CONTROL = "/access-control",
  INTEGRATIONS = "/integrations",
  INTEGRATIONS_SETTINGS = "/integrations/settings",
  ADMINISTRATION = "/administration",
}

const isPage = (v: PageInterface | boolean): v is PageInterface => {
  return (v as PageInterface).title !== undefined;
};

export default function usePageNavigation() {
  const isLimitedUser = useIsLimitedUser();
  const isRegularUser = useIsRegularUser();
  const accessControlEnabled = useFeatureEnabled(
    FeatureFlags.ACCESS_CONTROL_ENABLED
  );
  const assistantEnabled = useFeatureEnabled(FeatureFlags.ASSISTANT_ENABLED);
  const dashboardEnabled = useFeatureEnabled(
    FeatureFlags.DASHBOARD_PAGE_ENABLED
  );
  const { pathname } = useLocation();
  const theme = useTheme();

  const getNavIcon = (path: string) => {
    const color = pathname.startsWith(path)
      ? theme.palette.common.white
      : theme.palette.text.primary;

    switch (path) {
      case PathNames.LIVE_VIEW:
        return <LiveIcon color={color} />;
      case PathNames.PERSONAL_WALL:
        return <WallIcon color={color} />;
      case PathNames.DEVICES:
        return <DeviceIcon color={color} />;
      case PathNames.DISCOVER:
        return <DiscoverIcon color={color} />;
      case PathNames.ASSISTANT:
        return <AssistantIcon color={color} />;
      case PathNames.ARCHIVE:
        return <ArchiveIcon color={color} />;
      case PathNames.ANALYTICS:
        return <FaceIdIcon color={color} />;
      case PathNames.KIOSK:
        return <KioskIcon color={color} />;
      case PathNames.INSIGHTS:
        return <DashboardIcon color={color} />;
      case PathNames.ACCESS_CONTROL:
      case PathNames.INTEGRATIONS:
        return <ScanIcon color={color} />;
      default:
        return <React.Fragment></React.Fragment>;
    }
  };

  const pages = [
    {
      title: "Live View",
      path: PathNames.LIVE_VIEW,
      icon: getNavIcon(PathNames.LIVE_VIEW),
    },
    {
      title: "Personal Wall",
      path: "/wall",
      icon: getNavIcon(PathNames.PERSONAL_WALL),
    },
    {
      title: "Devices",
      path: "/devices",
      icon: getNavIcon(PathNames.DEVICES),
    },
    isLimitedUser && {
      title: "Discover",
      path: "/discover",
      icon: getNavIcon(PathNames.DISCOVER),
    },
    assistantEnabled &&
      isLimitedUser && {
        title: "Assistant",
        path: "/assistant",
        icon: getNavIcon(PathNames.ASSISTANT),
      },
    isLimitedUser && {
      title: "Archive",
      path: "/archive",
      icon: getNavIcon(PathNames.ARCHIVE),
    },
    isRegularUser && {
      title: "AI Analytics",
      path: "/analytics",
      icon: getNavIcon(PathNames.ANALYTICS),
    },
    dashboardEnabled &&
      isLimitedUser && {
        title: "Insights",
        path: PathNames.INSIGHTS,
        icon: getNavIcon(PathNames.INSIGHTS),
      },
    isLimitedUser && {
      title: "Kiosk",
      path: "/kiosk",
      icon: getNavIcon(PathNames.KIOSK),
    },
    accessControlEnabled &&
      isLimitedUser && {
        title: "Integrations",
        path: PathNames.INTEGRATIONS,
        icon: getNavIcon(PathNames.INTEGRATIONS),
      },
  ].filter(isPage);
  return pages;
}
