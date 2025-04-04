import { CircularProgress, IconButton, Switch } from "@mui/material";
import { ApiError, CameraResponse, DevicesService } from "coram-common-utils";
import { useIsAdmin } from "components/layout/RoleGuards";
import { useContext, useEffect, useState } from "react";
import type { QueryObserverResult } from "react-query";
import { NotificationContext } from "contexts/notification_context";
import { Stack } from "@mui/system";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import { CameraRowInfoPopover } from "./CameraRowInfoPopover";

export function EnableCell({
  stream,
  refetch,
}: {
  stream: CameraResponse;
  refetch: () => Promise<QueryObserverResult<CameraResponse[]>>;
}) {
  const { setNotificationData } = useContext(NotificationContext);

  const [loading, setLoading] = useState(false);
  // This is for optimistic updates when we send the request to the backend
  const [checked, setChecked] = useState(stream.camera.is_enabled);

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const isAdmin = useIsAdmin();

  useEffect(
    () => setChecked(stream.camera.is_enabled),
    [stream.camera.is_enabled]
  );

  async function handleToggle(isEnabled: boolean) {
    try {
      setLoading(true);
      setChecked(isEnabled);

      if (isEnabled) {
        await DevicesService.enableCamera(stream.camera.id);
      } else {
        await DevicesService.disableCamera(stream.camera.id);
      }

      await refetch();
    } catch (error) {
      setChecked(!isEnabled);

      if (error instanceof ApiError && error.status === 409) {
        setNotificationData({
          message: "CVR over capacity",
          severity: "error",
        });
      } else {
        setNotificationData({
          message: "Something went wrong",
          severity: "error",
        });
        console.error(`Unexpected error during camera toggle: ${error}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between">
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Switch
          color="secondary"
          disabled={loading || !isAdmin}
          checked={checked}
          onChange={(_, isEnabled) => handleToggle(isEnabled)}
        />
        {loading && <CircularProgress size={20} color="secondary" />}
      </Stack>
      <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
        <InfoOutlinedIcon sx={{ color: "#3C3E49", fontSize: "medium" }} />
      </IconButton>
      <CameraRowInfoPopover
        stream={stream}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      />
    </Stack>
  );
}
