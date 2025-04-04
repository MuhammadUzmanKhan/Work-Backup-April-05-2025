import {
  Divider,
  IconButton,
  MenuList,
  Popover,
  styled,
  Typography,
} from "@mui/material";
import {
  DashboardsSummaryReponse,
  type DashboardSummary,
} from "coram-common-utils";
import { isDefined } from "coram-common-utils";
import { DashboardMenuItem } from "./DashboardMenuItem";
import { MouseEvent, useState } from "react";
import {
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from "@mui/icons-material";

interface DashboardSelectorProps {
  dashboardsSummary: DashboardsSummaryReponse;
  onSelectDashboard: (dashboardId: number) => void;
}

export function DashboardSelector({
  dashboardsSummary,
  onSelectDashboard,
}: DashboardSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();

  const dashboardLookup = dashboardsSummary.all_dashboards_summary.reduce(
    (acc, dashboard) => {
      acc.set(dashboard.id, dashboard);
      return acc;
    },
    new Map<number, DashboardSummary>()
  );

  const recentlyViewedDashboards =
    dashboardsSummary.recently_viewed_dashboards_ids
      .map((dashboardId) => dashboardLookup.get(dashboardId))
      .filter(isDefined);

  function closePopover() {
    setAnchorEl(undefined);
  }

  return (
    <>
      <IconButton
        sx={{ p: 0 }}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          setAnchorEl(event.currentTarget);
        }}
      >
        {isDefined(anchorEl) ? (
          <ArrowDropUpIcon sx={{ color: "text.primary" }} fontSize="large" />
        ) : (
          <ArrowDropDownIcon sx={{ color: "text.primary" }} fontSize="large" />
        )}
      </IconButton>
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        PaperProps={{
          style: {
            width: 345,
            maxHeight: 500,
          },
        }}
      >
        <MenuList>
          <MenuSectionTitle variant="body2">Recent</MenuSectionTitle>
          {recentlyViewedDashboards.map((dashboard) => (
            <DashboardMenuItem
              key={dashboard.id}
              title={dashboard.title}
              isFavorite={dashboard.is_favorite}
              onClick={() => {
                onSelectDashboard(dashboard.id);
                closePopover();
              }}
            />
          ))}
          <Divider />
          <MenuSectionTitle variant="body2">All Dashboard</MenuSectionTitle>
          {dashboardsSummary.all_dashboards_summary.map((dashboard) => (
            <DashboardMenuItem
              key={dashboard.id}
              title={dashboard.title}
              isFavorite={dashboard.is_favorite}
              onClick={() => onSelectDashboard(dashboard.id)}
            />
          ))}
        </MenuList>
      </Popover>
    </>
  );
}

const MenuSectionTitle = styled(Typography)({
  fontWeight: 600,
  paddingLeft: "16px",
  paddingTop: "8px",
  paddingBottom: "8px",
});
