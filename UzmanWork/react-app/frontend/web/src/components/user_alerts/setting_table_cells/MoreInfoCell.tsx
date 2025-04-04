import { Button, Portal, Stack, Typography, styled } from "@mui/material";
import { UserAlertSetting, UserAlertsService } from "coram-common-utils";
import { DateTime } from "luxon";
import { Fragment, useRef, useState } from "react";

const AlertActionButton = styled(Button)(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[900]}`,
  color: theme.palette.grey[900],
  padding: "0.2rem 0px",
  borderRadius: "3px",
}));

interface MoreInfoCellProps {
  alertSetting: UserAlertSetting;
  show: boolean;
  onSelectAlertForPreview: (alertSetting: UserAlertSetting) => void;
  onEditAlertSetting: (alertSetting: UserAlertSetting) => void;
  // refetch to update the query output after deleting.
  refetch: () => void;
}

export function MoreInfoCell({
  alertSetting,
  show,
  onSelectAlertForPreview,
  onEditAlertSetting,
  refetch,
}: MoreInfoCellProps) {
  const container = useRef(null);
  const [loading, setLoading] = useState<boolean>(false);
  async function handleDelete() {
    setLoading(true);
    try {
      await UserAlertsService.deleteUserAlert([alertSetting.id]);
      refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Fragment>
      {show ? (
        <Portal container={container.current}>
          <Stack direction="row" alignItems="center" gap={1} lineHeight={3}>
            <img width={15} height={15} src="/static/alert-camera.png" />
            <Typography variant="body2">
              {alertSetting.camera_mac_address}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" gap={1}>
            <img width={15} height={15} src="/static/alert-clock.png" />
            <Typography variant="body2">
              {alertSetting.creation_time &&
                DateTime.fromISO(alertSetting.creation_time).toLocaleString(
                  DateTime.DATE_SHORT
                )}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mt={2}
            gap={2}
          >
            <AlertActionButton
              variant="outlined"
              onClick={() => onSelectAlertForPreview(alertSetting)}
              size="small"
              fullWidth={true}
            >
              View
            </AlertActionButton>
            <AlertActionButton
              variant="outlined"
              onClick={() => onEditAlertSetting(alertSetting)}
              size="small"
              fullWidth={true}
            >
              Edit
            </AlertActionButton>
            <AlertActionButton
              variant="outlined"
              onClick={() => handleDelete()}
              disabled={loading}
              size="small"
              fullWidth={true}
            >
              Delete
            </AlertActionButton>
          </Stack>
        </Portal>
      ) : null}
      <Stack ref={container}></Stack>
    </Fragment>
  );
}
