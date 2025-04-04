import { Stack } from "@mui/material";
import { UserAlertSettingCreate } from "coram-common-utils";
import { EmailTextField } from "components/EmailTextField";
import { PhoneNumberTextField } from "components/PhoneNumberTextField";
import { Dispatch, SetStateAction } from "react";

interface NotifyOptionsProps {
  alertSettings: UserAlertSettingCreate;
  setAlertSettings: Dispatch<SetStateAction<UserAlertSettingCreate>>;
}

export function NotifyOptions({
  alertSettings,
  setAlertSettings,
}: NotifyOptionsProps) {
  return (
    <Stack direction="column" spacing={2}>
      <PhoneNumberTextField
        fullWidth
        size="small"
        value={alertSettings.phone}
        placeholder="Mobile (Optional)"
        onChange={(e) => setAlertSettings({ ...alertSettings, phone: e })}
      />
      <EmailTextField
        fullWidth
        size="small"
        placeholder="E-mail (Optional)"
        variant="outlined"
        id="name"
        value={alertSettings.email}
        onChange={(e) =>
          setAlertSettings({ ...alertSettings, email: e.target.value })
        }
      />
    </Stack>
  );
}
