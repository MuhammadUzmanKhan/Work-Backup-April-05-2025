import {
  styled,
  type SxProps,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

const ToggleIcon = styled(ToggleButton, {
  shouldForwardProp: (prop) => prop !== "isDisabled",
})<{ isDisabled?: boolean }>(({ theme, isDisabled }) => ({
  minHeight: "2.5rem",
  borderRadius: "0px 4px 4px 0px",
  borderColor: theme.palette.neutral?.["A400"],
  color: theme.palette.common.black,
  flexGrow: 1,
  opacity: 1,
  flexBasis: "0",
  textTransform: "none",
  cursor: isDisabled ? "not-allowed" : "pointer",
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    "&:hover": {
      backgroundColor: theme.palette.primary.light,
    },
  },
}));

export interface ToggleButtonData<T extends string> {
  value: T;
  disabled?: boolean;
  disabledReason?: string;
}

interface StyledToggleButtonProps<T extends string> {
  button1Data: ToggleButtonData<T>;
  button2Data: ToggleButtonData<T>;
  currentValue: T;
  onChange: (value: T) => void;
  sx?: SxProps;
}

export function StyledToggleButton<T extends string>({
  button1Data,
  button2Data,
  currentValue,
  onChange,
  sx,
}: StyledToggleButtonProps<T>) {
  return (
    <ToggleButtonGroup value={currentValue} size="small" exclusive sx={sx}>
      {/* NOTE(@lberg): these have to be direct children, not even custom components work */}
      <ToggleIcon
        value={button1Data.value}
        onClick={() =>
          button1Data.disabled ? null : onChange(button1Data.value)
        }
        isDisabled={button1Data.disabled}
      >
        <Tooltip title={button1Data.disabled ? button1Data.disabledReason : ""}>
          <Typography variant="body1">{button1Data.value}</Typography>
        </Tooltip>
      </ToggleIcon>
      <ToggleIcon
        value={button2Data.value}
        onClick={() =>
          button2Data.disabled ? null : onChange(button2Data.value)
        }
        isDisabled={button2Data.disabled}
      >
        <Tooltip title={button2Data.disabled ? button2Data.disabledReason : ""}>
          <Typography variant="body1">{button2Data.value}</Typography>
        </Tooltip>
      </ToggleIcon>
    </ToggleButtonGroup>
  );
}
