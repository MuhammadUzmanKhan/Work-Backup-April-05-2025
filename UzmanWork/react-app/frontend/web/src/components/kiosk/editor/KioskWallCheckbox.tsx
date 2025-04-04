import { FormControlLabel, Checkbox, Typography } from "@mui/material";

interface KioskWallCheckboxProps {
  labelName: string;
  isChecked: boolean;
  onChange: (isChecked: boolean) => void;
  disabled?: boolean;
}

export function KioskWallCheckbox({
  labelName,
  isChecked,
  onChange,
  disabled = false,
}: KioskWallCheckboxProps) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={isChecked}
          onChange={(ev) => onChange(ev.target.checked)}
          sx={{ px: 0 }}
        />
      }
      labelPlacement="start"
      label={<Typography variant="h3">{labelName}</Typography>}
      disabled={disabled}
      sx={{
        justifyContent: "space-between",
        margin: 0,
      }}
    />
  );
}
