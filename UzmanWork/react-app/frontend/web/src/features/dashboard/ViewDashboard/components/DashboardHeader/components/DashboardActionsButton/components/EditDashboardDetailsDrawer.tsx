import {
  Avatar,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { StyledDrawer } from "components/styled_components/StyledDrawer";
import { ChangeEvent, useState } from "react";
import { DashboardService } from "coram-common-utils";
import { Close as CloseIcon } from "@mui/icons-material";
import { type DashboardResponse } from "features/dashboard/types";

interface EditDashboardDetailsDrawerProps {
  dashboard: DashboardResponse;
  open: boolean;
  onClose: VoidFunction;
  refetchData: () => Promise<unknown>;
}

export function EditDashboardDetailsDrawer({
  dashboard,
  open,
  onClose,
  refetchData,
}: EditDashboardDetailsDrawerProps) {
  const [dashboardName, setDashboardName] = useState(dashboard.title);
  const [dashboardDescription, setDashboardDescription] = useState<string>(
    dashboard.description ?? ""
  );

  async function handleSaveDashboardDetails() {
    await DashboardService.updateDashboardDetails({
      id: dashboard.id,
      title: dashboardName,
      description: dashboardDescription,
    });
    await refetchData();
    onClose();
  }

  return (
    <StyledDrawer open={open} onClose={onClose}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        px={3}
        py={1.5}
      >
        <Typography variant="h3">Dashboard Details</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Divider />
      <Stack p={3} justifyContent="space-between" height="100%">
        <Stack gap={2}>
          <Stack gap={1}>
            <Typography variant="body1">Dashboard Name</Typography>
            <TextField
              size="small"
              value={dashboardName}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setDashboardName(event.target.value);
              }}
            />
          </Stack>
          <Stack gap={1}>
            <Typography variant="body1">Dashboard Owner</Typography>
            <Stack
              direction="row"
              justifyContent="start"
              alignItems="center"
              gap={1}
            >
              <Avatar
                sx={{
                  bgcolor: "neutral.200",
                  color: "common.black",
                  width: "32px",
                  height: "32px",
                }}
              >
                <Typography variant="body1">
                  {`${dashboard.owner_user_email[0] ?? "U"}`.toUpperCase()}
                </Typography>
              </Avatar>
              <Typography variant="body1">{`${dashboard.owner_user_email}`}</Typography>
            </Stack>
          </Stack>
          <Stack gap={1}>
            <Typography variant="body1">Dashboard Description</Typography>
            <TextField
              placeholder="Enter text here"
              value={dashboardDescription}
              onChange={(e) => setDashboardDescription(e.target.value)}
              multiline
              rows={3}
            />
          </Stack>
        </Stack>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveDashboardDetails}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            sx={{
              color: "text.primary",
              borderColor: "text.primary",
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
        </Stack>
      </Stack>
    </StyledDrawer>
  );
}
