import React from "react";
import { useTheme } from "@mui/material";

import { useLocation } from "react-router";
import { LiveIcon } from "../icons/live-icon";
import { WallIcon } from "../icons/wall-icon";

interface PageInterface {
  title: string;
  path: string;
  icon: JSX.Element;
}

export enum PathNames {
  LIVE_VIEW = "/live",
  PERSONAL_WALL = "/wall",
}

const isPage = (v: PageInterface | boolean): v is PageInterface => {
  return (v as PageInterface).title !== undefined;
};

export default function usePageNavigation() {
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
  ].filter(isPage);
  return pages;
}
