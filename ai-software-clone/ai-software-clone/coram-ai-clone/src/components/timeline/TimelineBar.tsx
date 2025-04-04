import {
  Box,
  Drawer,
  Stack,
  Typography,
  styled,
  useTheme,
} from "@mui/material";

import { TOOLBAR_HEIGHT_PX } from "../../navbar/navbar";
import { SearchIcon2 } from "../../icons/search-icon";
import { NotificationIcon } from "../../icons/notification-icon";
// import { DirectionWalkIcon } from "../../icons/direction-walk-icon";
// import { AnalyticsIcon } from "../../icons/analytics-icon";
// import { HistoryToggleIcon } from "../../icons/history-toggle-icon";
// import { InfoIcon } from "../../icons/info-icon";
import { TimelineBarSelectors } from "./timeline_bar";
import { StyledTimelineBarButton } from "../../styled_components/StyledTimelineBarButton";

interface TimelineBarProps {
  onSearchIconClick: () => void;
  // onTimelapseClick: () => void;
  // onInfoIconClick: () => void;
  onNewAlertIconClick: () => void;
  // onAnalyticsIconClick: () => void;
  // onJourneyIconClick: () => void;
  timelineBarSelectors: TimelineBarSelectors;
}

const DrawerItem = styled(Box)({
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
});

export function TimelineBar({
  onSearchIconClick,
  // onTimelapseClick,
  // onInfoIconClick,
  onNewAlertIconClick,
  // onAnalyticsIconClick,
  // onJourneyIconClick,
  timelineBarSelectors,
}: TimelineBarProps) {
  const theme = useTheme();

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      PaperProps={{
        sx: {
          top: `${TOOLBAR_HEIGHT_PX}px`,
          height: `calc(100% - ${TOOLBAR_HEIGHT_PX}px)`,
          width: "3.75rem",
          paddingTop: "1.375rem",
          boxSizing: "border-box",
          boxShadow: theme.shadows[23],
          overflowX: "auto",
        },
      }}
    >
      <Stack alignItems="center" gap="1.25rem">
        <DrawerItem
          onClick={() => {
            onSearchIconClick();
          }}
        >
          <StyledTimelineBarButton isSelected={timelineBarSelectors.showSearch}>
            <SearchIcon2
              color={timelineBarSelectors.showSearch ? "#FFFF" : "#3C3E49"}
            />
          </StyledTimelineBarButton>
          <Typography variant="body3">Search </Typography>
        </DrawerItem>

        <DrawerItem
          onClick={() => {
            onNewAlertIconClick();
          }}
        >
          <StyledTimelineBarButton isSelected={timelineBarSelectors.showAlert}>
            <NotificationIcon
              color={timelineBarSelectors.showAlert ? "#FFFF" : "#3C3E49"}
            />
          </StyledTimelineBarButton>
          <Typography variant="body3">Alert</Typography>
        </DrawerItem>
        {/* 
        <DrawerItem
          onClick={() => {
            onJourneyIconClick();
          }}
        >
          <StyledTimelineBarButton
            isSelected={timelineBarSelectors.showJourney}
          >
            <DirectionWalkIcon
              color={timelineBarSelectors.showJourney ? "#FFFF" : "#3C3E49"}
            />
          </StyledTimelineBarButton>
          <Typography variant="body3">Journey Path</Typography>
        </DrawerItem>

        <DrawerItem
          onClick={() => {
            onAnalyticsIconClick();
          }}
        >
          <StyledTimelineBarButton
            isSelected={timelineBarSelectors.showAnalyticsControls}
          >
            <AnalyticsIcon
              color={
                timelineBarSelectors.showAnalyticsControls ? "#FFFF" : "#3C3E49"
              }
            />
          </StyledTimelineBarButton>
          <Typography variant="body3">Analytics</Typography>
        </DrawerItem>

        <DrawerItem
          onClick={() => {
            onTimelapseClick();
          }}
        >
          <StyledTimelineBarButton
            isSelected={timelineBarSelectors.showTimelapse}
          >
            <HistoryToggleIcon
              color={timelineBarSelectors.showTimelapse ? "#FFFF" : "#3C3E49"}
            />
          </StyledTimelineBarButton>
          <Typography variant="body3">
            Time <br />
            Lapse
          </Typography>
        </DrawerItem>
        <DrawerItem
          onClick={() => {
            onInfoIconClick();
          }}
        >
          <StyledTimelineBarButton isSelected={timelineBarSelectors.showInfo}>
            <InfoIcon
              color={timelineBarSelectors.showInfo ? "#FFFF" : "#3C3E49"}
            />
          </StyledTimelineBarButton>
          <Typography variant="body3">Info</Typography>
        </DrawerItem>  */}
      </Stack>
    </Drawer>
  );
}
