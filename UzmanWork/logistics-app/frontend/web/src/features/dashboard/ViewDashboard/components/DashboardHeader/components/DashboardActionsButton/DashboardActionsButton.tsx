import {
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { Button } from "@mui/material";
import {
  DasbhboardActionsMenu,
  EditDashboardDetailsDrawer,
} from "./components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardService, isDefined, MountIf } from "coram-common-utils";
import { DashboardResponse } from "features/dashboard/types";
import { useConfirmDelete } from "utils/confirm";
import { useQueryClient } from "react-query";
import { DASHBOARD_SUMMARY_QUERY_KEY } from "features/dashboard/consts";
import { PathNames } from "hooks/usePageNavigation";

interface DashboardActionsButtonProps {
  dashboard: DashboardResponse;
  refetchData: () => Promise<unknown>;
}

export function DashboardActionsButton({
  dashboard,
  refetchData,
}: DashboardActionsButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement>();

  const [openDashboardDetailsDrawer, setOpenDashboardDetailsDrawer] =
    useState<boolean>(false);

  const handleDeleteDashboard = useConfirmDelete(async () => {
    setMenuAnchorEl(undefined);
    await DashboardService.deleteDashboard(dashboard.id);
    await queryClient.invalidateQueries(DASHBOARD_SUMMARY_QUERY_KEY);
    navigate(PathNames.INSIGHTS);
  });

  return (
    <>
      <Button
        variant="outlined"
        onClick={(ev) => setMenuAnchorEl(ev.currentTarget)}
        sx={{
          color: "text.primary",
          borderColor: "text.primary",
        }}
        endIcon={
          isDefined(menuAnchorEl) ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )
        }
      >
        Actions
      </Button>
      <DasbhboardActionsMenu
        anchorEl={menuAnchorEl}
        onClose={() => setMenuAnchorEl(undefined)}
        onEditDashboard={() => {
          setMenuAnchorEl(undefined);
          setOpenDashboardDetailsDrawer(true);
        }}
        onDeleteDashboard={async () => {
          await handleDeleteDashboard();
        }}
      />
      <MountIf condition={openDashboardDetailsDrawer}>
        <EditDashboardDetailsDrawer
          dashboard={dashboard}
          open={openDashboardDetailsDrawer}
          onClose={() => setOpenDashboardDetailsDrawer(false)}
          refetchData={refetchData}
        />
      </MountIf>
    </>
  );
}
