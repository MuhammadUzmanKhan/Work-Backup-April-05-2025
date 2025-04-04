import { DeviceIcon } from "icons/device-icon";
import { DiscoverIcon } from "icons/discover-icon";
import { LiveIcon } from "icons/live-icon";
import { SettingsIcon } from "icons/settings-icon";
import { WallIcon } from "icons/wall-icon";

// Every item in this array will be rendered in the bottom nav bar on mobile devices
export const MOBILE_BOTTOM_NAVBAR_ITEMS = [
  {
    title: "Live View",
    path: "/live",
    icon: <LiveIcon />,
  },
  {
    title: "Personal Wall",
    path: "/wall",
    icon: <WallIcon />,
  },
  {
    title: "Devices",
    path: "/devices",
    icon: <DeviceIcon />,
  },
  {
    title: "Discover",
    path: "/discover",
    icon: <DiscoverIcon />,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <SettingsIcon />,
  },
];

// Every item in this array will be rendered in the top nav bar on mobile devices
// NOTE(@lberg): we only need the title and path here.
// TODO(@lberg): this will be removed when we remove the navbar from mobile
export const MOBILE_NAVBAR_ITEMS = [
  ...MOBILE_BOTTOM_NAVBAR_ITEMS,
  {
    title: "Timeline",
    path: "/timeline",
  },
];
