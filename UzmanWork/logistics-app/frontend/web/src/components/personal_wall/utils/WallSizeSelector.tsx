import { Stack, Tooltip, Typography, useTheme } from "@mui/material";
import {
  RemoveCircle as RemoveCircleIcon,
  AddCircle as AddCircleIcon,
} from "@mui/icons-material";
interface WallSizeSelectorProps {
  value: number;
  maxValue?: number;
  minValue?: number;
  step?: number;
  onChange: (value: number) => void;
}
export function WallSizeSelector({
  value,
  maxValue = 100,
  minValue = 0,
  step = 10,
  onChange,
}: WallSizeSelectorProps) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      px={2}
      py={1}
      alignItems="center"
      border="1px solid lightgray"
      borderRadius={0.5}
    >
      <RemoveCircleIcon
        sx={{
          cursor: "pointer",
          color:
            value > minValue
              ? theme.palette.secondary.main
              : theme.palette.grey[400],
        }}
        onClick={() => onChange(Math.max(value - step, minValue))}
      />
      <Tooltip title="Zoom level of the wall">
        <Typography
          sx={{ minWidth: "3rem", textAlign: "center" }}
          variant="body2"
        >
          {value}%
        </Typography>
      </Tooltip>
      <AddCircleIcon
        sx={{
          cursor: "pointer",
          color:
            value < maxValue
              ? theme.palette.secondary.main
              : theme.palette.grey[400],
        }}
        color={value < maxValue ? "secondary" : "disabled"}
        onClick={() => onChange(Math.min(value + step, maxValue))}
      />
    </Stack>
  );
}
