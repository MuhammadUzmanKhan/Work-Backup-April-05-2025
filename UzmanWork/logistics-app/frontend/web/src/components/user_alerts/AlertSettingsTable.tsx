import { Divider, Stack, Typography } from "@mui/material";
import { UserAlertSetting } from "coram-common-utils";
import { Fragment, useState } from "react";
import { MoreInfoCell } from "./setting_table_cells/MoreInfoCell";
import { NameCell } from "./setting_table_cells/NameCell";

interface AlertSettingsTableProps {
  alertSettings: UserAlertSetting[];
  onSelectAlertForPreview: (alertSetting: UserAlertSetting) => void;
  onEditAlertSetting: (alertSetting: UserAlertSetting) => void;
  refetch: () => void;
}

export function AlertSettingsTable({
  alertSettings,
  onSelectAlertForPreview,
  onEditAlertSetting,
  refetch,
}: AlertSettingsTableProps) {
  const [selected, setSelected] = useState<UserAlertSetting | null>();

  return (
    <Stack spacing={1}>
      {alertSettings
        .sort((a, b) => (a.id > b.id ? 1 : -1))
        .map((alertSetting) => (
          <Fragment key={alertSetting.id}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <NameCell alertSetting={alertSetting} refetch={refetch} />
              <Typography
                variant="body1"
                onClick={() =>
                  setSelected(
                    selected && selected.id === alertSetting.id
                      ? null
                      : alertSetting
                  )
                }
                sx={{
                  color: "primary.main",
                  cursor: "pointer",
                }}
              >
                {selected && selected.id === alertSetting.id ? "Hide" : "Show"}
              </Typography>
            </Stack>
            <MoreInfoCell
              show={!!(selected?.id === alertSetting.id)}
              alertSetting={alertSetting}
              onSelectAlertForPreview={onSelectAlertForPreview}
              onEditAlertSetting={onEditAlertSetting}
              refetch={refetch}
            />
            <Divider sx={{ width: "100%" }} />
          </Fragment>
        ))}
    </Stack>
  );
}
