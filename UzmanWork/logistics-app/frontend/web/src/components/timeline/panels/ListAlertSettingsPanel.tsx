import { Button, Divider, Stack, Typography } from "@mui/material";
import { UserAlertSetting } from "coram-common-utils";

import { PanelHeader } from "../common_panel/PanelHeader";
import {
  PanelContainer,
  PanelContainerProps,
} from "../common_panel/PanelContainer";
import { AlertSettingsTable } from "components/user_alerts/AlertSettingsTable";
import { useUserAlertSettings } from "utils/globals";

interface ListAlertSettingsPanelProps {
  cameraMacAddress: string;
  onSelectAlertForPreview: (alertSetting: UserAlertSetting) => void;
  onEditAlertSetting: (alertSetting: UserAlertSetting) => void;
  onCreateNewAlertSetting: () => void;
  onCloseClick: () => void;
  containerProps?: PanelContainerProps;
}

export function ListAlertSettingsPanel({
  cameraMacAddress,
  onSelectAlertForPreview,
  onEditAlertSetting,
  onCreateNewAlertSetting,
  onCloseClick,
  containerProps,
}: ListAlertSettingsPanelProps) {
  const { data: alertSettings, refetch: refetchAlertSettings } =
    useUserAlertSettings({
      cameraMacAddress: cameraMacAddress,
      staleTime: Infinity,
      refetchOnMount: "always",
    });

  return (
    <PanelContainer {...containerProps}>
      <PanelHeader
        title={`ALERTS (${alertSettings?.length || 0})`}
        onCloseClick={onCloseClick}
      />
      <Stack direction="row" p={1} justifyContent="center" alignItems="center">
        <Button
          color="secondary"
          variant="contained"
          sx={{
            width: "100%",
            borderRadius: "0.3rem",
            mt: 2,
          }}
          onClick={onCreateNewAlertSetting}
        >
          <Typography variant="body2"> Create New Alert</Typography>
        </Button>
      </Stack>

      <Stack direction="column" spacing={2} p={2}>
        <Divider sx={{ width: "100%" }} />
        <AlertSettingsTable
          alertSettings={alertSettings ?? []}
          onSelectAlertForPreview={onSelectAlertForPreview}
          onEditAlertSetting={onEditAlertSetting}
          refetch={refetchAlertSettings}
        />
      </Stack>
    </PanelContainer>
  );
}
