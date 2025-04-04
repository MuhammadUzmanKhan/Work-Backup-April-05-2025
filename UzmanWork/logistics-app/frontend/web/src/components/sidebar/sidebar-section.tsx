import { List } from "@mui/material";
import { ReactNode } from "react";
import { SidebarItem } from "./sidebar-item";

interface Item {
  path?: string;
  icon?: ReactNode;
  chip?: ReactNode;
  info?: ReactNode;
  title: string;
}

export function renderNavItems({
  items,
  path,
  isSidebarOpen,
}: {
  items: Item[];
  path: string;
  isSidebarOpen?: boolean;
}) {
  return (
    <List disablePadding>
      {items.map((item) => {
        const isActive = item.path ? path.includes(item.path) : false;
        return (
          <SidebarItem
            key={item.title}
            isSidebarOpen={isSidebarOpen}
            active={isActive}
            chip={item.chip}
            icon={item.icon}
            info={item.info}
            path={item.path}
            title={item.title}
          />
        );
      })}
    </List>
  );
}
