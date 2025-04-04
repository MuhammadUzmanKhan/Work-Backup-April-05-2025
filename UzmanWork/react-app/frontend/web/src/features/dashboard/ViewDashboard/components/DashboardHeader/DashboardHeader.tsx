import { IconButton, Stack, Typography } from "@mui/material";
import { DashboardService, isDefined } from "coram-common-utils";
import { FavoriteIcon } from "icons/favorite-icon";
import { DashboardResponse } from "features/dashboard/types";
import { useDashboardsSummary } from "features/dashboard/hooks";
import { useIsMobile } from "components/layout/MobileOnly";
import { DashboardActionsButton, DashboardSelector } from "./components";
import { LoadingButton } from "@mui/lab";
import { CreateDashboardButton } from "features/dashboard/components";

interface DashboardHeaderProps {
  dashboard: DashboardResponse;
  refetchDashboard: () => Promise<unknown>;
  onSelectDashboard: (dashboardId: number) => Promise<void>;
  onCreateReport: () => Promise<void>;
  isCreatingReport: boolean;
}

export function DashboardHeader({
  dashboard,
  refetchDashboard,
  onSelectDashboard,
  onCreateReport,
  isCreatingReport,
}: DashboardHeaderProps) {
  const isMobile = useIsMobile();

  const { data: dashboardsSummary, refetch: refetchDashboardInfo } =
    useDashboardsSummary();

  const isFavoriteDashboard =
    dashboardsSummary?.all_dashboards_summary.find(
      (dashboardSummary) => dashboardSummary.id === dashboard.id
    )?.is_favorite ?? false;

  async function handleToggleFavorite() {
    await DashboardService.updateUserFavorite({
      dashboard_id: dashboard.id,
      is_favorite: !isFavoriteDashboard,
    });
    await refetchDashboardInfo();
  }

  async function refetchData() {
    await refetchDashboard();
    await refetchDashboardInfo();
  }

  return (
    <Stack
      direction="row"
      pt={2}
      px={3}
      justifyContent="space-between"
      alignItems="center"
      position="sticky"
      top={0}
    >
      <Stack
        direction="row"
        gap={1}
        justifyContent="space-between"
        alignItems="center"
      >
        <IconButton onClick={handleToggleFavorite} sx={{ p: 0 }}>
          <FavoriteIcon color={isFavoriteDashboard ? "#FF9900" : "#B0B6C2"} />
        </IconButton>
        <Typography variant="h2">{dashboard.title}</Typography>
        {isDefined(dashboardsSummary) && (
          <DashboardSelector
            dashboardsSummary={dashboardsSummary}
            onSelectDashboard={async (dashboardId: number) =>
              onSelectDashboard(dashboardId)
            }
          />
        )}
      </Stack>
      {!isMobile && (
        <Stack direction="row" justifyContent="space-between" gap={1}>
          <CreateDashboardButton
            color="primary"
            variant="outlined"
            sx={{
              color: "text.primary",
              borderColor: "text.primary",
            }}
          />
          <DashboardActionsButton
            dashboard={dashboard}
            refetchData={refetchData}
          />
          <LoadingButton
            color="secondary"
            variant="contained"
            onClick={onCreateReport}
            loading={isCreatingReport}
          >
            Add Report
          </LoadingButton>
        </Stack>
      )}
    </Stack>
  );
}
