import {
  AnalyticsResponse,
  DetectionObjectTypeCategory,
} from "coram-common-utils";
import Grid from "@mui/material/Unstable_Grid2";
import {
  AccessTime as AccessTimeIcon,
  AccessTimeFilled as AccessTimeFilledIcon,
  DirectionsCar as DirectionsCarIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { TrackingAnalyticsCard } from "./TrackingAnalyticsCard";
import { useObjectTrackingAnalytics } from "hooks/analytics";

const GRID_WIDTH = 2.4;

interface TrackingAnalyticsCardGridProps {
  analytics: AnalyticsResponse;
}

export function TrackingAnalyticsCardGrid({
  analytics,
}: TrackingAnalyticsCardGridProps) {
  const personTrackingInfo = useObjectTrackingAnalytics(
    analytics.tracking_analytics,
    DetectionObjectTypeCategory.PERSON
  );

  const vehicleTrackingInfo = useObjectTrackingAnalytics(
    analytics.tracking_analytics,
    DetectionObjectTypeCategory.VEHICLE
  );

  return (
    <Grid
      container
      spacing={3}
      justifyContent="center"
      paddingX={1}
      paddingY={2}
    >
      <Grid xs={GRID_WIDTH}>
        <TrackingAnalyticsCard
          Icon={PersonIcon}
          title="People Count"
          value={personTrackingInfo.num_tracks}
        />
      </Grid>
      <Grid xs={GRID_WIDTH}>
        <TrackingAnalyticsCard
          Icon={DirectionsCarIcon}
          title="Vehicle Count"
          value={vehicleTrackingInfo.num_tracks}
        />
      </Grid>
      <Grid xs={GRID_WIDTH}>
        <TrackingAnalyticsCard
          Icon={AccessTimeIcon}
          title="Avg People Idle Time"
          value={personTrackingInfo.avg_track_duration}
        />
      </Grid>
      <Grid xs={GRID_WIDTH}>
        <TrackingAnalyticsCard
          Icon={AccessTimeFilledIcon}
          title="Max People Idle Time"
          value={personTrackingInfo.max_track_duration}
        />
      </Grid>
    </Grid>
  );
}
