import { Stack, Switch, Typography } from "@mui/material";

interface PlayerSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}
export function PlayerSwitch({
  checked,
  disabled,
  onChange,
}: PlayerSwitchProps) {
  return (
    <Stack
      direction="row"
      px={2}
      alignItems="center"
      border="1px solid lightgray"
      borderRadius={0.5}
    >
      <Typography variant="body2">Player</Typography>

      <Switch
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        color="secondary"
      />
    </Stack>
  );
}
