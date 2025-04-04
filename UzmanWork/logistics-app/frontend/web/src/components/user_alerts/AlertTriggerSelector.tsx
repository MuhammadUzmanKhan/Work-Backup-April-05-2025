import { FormControl, MenuItem, Select } from "@mui/material";

import type { SelectChangeEvent } from "@mui/material";
import Box from "@mui/material/Box";

import { TriggerType, UserAlertSettingCreate } from "coram-common-utils";
import { Dispatch, SetStateAction, useState } from "react";

interface AlertTriggerSelectorProps {
  alertSetting: UserAlertSettingCreate;
  setAlertSetting?: Dispatch<SetStateAction<UserAlertSettingCreate>>;
}

export function AlertTriggerSelector({
  alertSetting,
  setAlertSetting,
}: AlertTriggerSelectorProps) {
  const triggerTypes = Array.from(Object.values(TriggerType));

  const [triggerType, setTriggerType] = useState<TriggerType | undefined>(
    alertSetting?.trigger_type
  );

  const handleChange = (event: SelectChangeEvent) => {
    const newSelType = event.target.value as TriggerType;
    setTriggerType(newSelType);

    if (setAlertSetting) {
      setAlertSetting({
        ...alertSetting,
        trigger_type: newSelType,
      });
    }
  };

  return (
    <Box>
      <FormControl variant="standard">
        <Select
          value={triggerType ?? ""}
          onChange={handleChange}
          displayEmpty
          inputProps={{ "aria-label": "Without label" }}
          disabled={setAlertSetting === undefined}
        >
          {triggerTypes.map((trigger_type) => {
            if (trigger_type == TriggerType.STICK_AROUND) {
              // Not implemented yet.
              return null;
            }
            return (
              <MenuItem
                key={Object.values(TriggerType).indexOf(trigger_type)}
                value={trigger_type}
              >
                {trigger_type}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
