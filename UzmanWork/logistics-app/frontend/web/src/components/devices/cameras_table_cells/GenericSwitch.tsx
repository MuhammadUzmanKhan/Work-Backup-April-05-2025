import {
  Stack,
  Typography,
  Switch,
  Tooltip,
  type TypographyProps,
  type SxProps,
  type SwitchProps,
} from "@mui/material";
import { useState } from "react";

interface GenericSwitchProps {
  value: boolean;
  callback: (value: boolean) => Promise<void>;
  onSuccessfulUpdate?: () => void;
  disabled?: boolean;
  caption?: string;
  tooltip?: string;
  sx?: SxProps;
  switchProps?: SwitchProps;
  textProps?: TypographyProps;
}

export function GenericSwitch({
  value,
  callback,
  onSuccessfulUpdate,
  disabled = false,
  caption = undefined,
  tooltip = undefined,
  textProps = undefined,
  sx = undefined,
  switchProps = undefined,
}: GenericSwitchProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setIsError(false);
    try {
      await callback(!value);
      onSuccessfulUpdate?.();
    } catch (e) {
      setIsError(true);
      console.error(e);
      setTimeout(() => setIsError(false), 2000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Tooltip title={tooltip} placement="bottom-start">
      <Stack direction="row" alignItems="center" sx={sx}>
        {caption && (
          <Typography
            variant="body1"
            color={isError ? "error" : "textSecondary"}
            sx={textProps}
          >
            {caption}
          </Typography>
        )}
        <Switch
          checked={value}
          onChange={handleUpdate}
          disabled={disabled || isUpdating || isError}
          color="secondary"
          {...switchProps}
        />
      </Stack>
    </Tooltip>
  );
}
