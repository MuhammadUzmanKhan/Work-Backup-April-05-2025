import {
  Checkbox,
  FormControlLabel,
  MenuItem,
  Typography,
} from "@mui/material";

interface CheckboxMenuItemProps {
  label: string;
  isChecked: boolean;
  onChange: () => void;
}

export function CheckboxMenuItem({
  label,
  isChecked,
  onChange,
}: CheckboxMenuItemProps) {
  return (
    <MenuItem onClick={(ev) => ev.stopPropagation()}>
      <FormControlLabel
        label={<Typography variant="body2">{label}</Typography>}
        control={
          <Checkbox
            color="secondary"
            size="small"
            checked={isChecked}
            onChange={onChange}
            sx={{ py: 0 }}
          />
        }
        onClick={(ev) => ev.stopPropagation()}
        sx={{
          minWidth: "100%",
          margin: 0,
        }}
      />
    </MenuItem>
  );
}
