import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { SxProps } from "@mui/system";
import { useCallback, useState } from "react";
import {
  ErrorOutlineOutlined as ErrorOutlineOutlinedIcon,
  CheckOutlined as CheckOutlineOutlinedIcon,
} from "@mui/icons-material";
import { ErrorState } from "../utils";

export const INITIAL_ERROR_STATE: ErrorState = {
  isStartTimeInvalid: false,
  isEndTimeInvalid: false,
  isSubmitError: false,
  errorMessage: "",
};

const RESET_AFTER_SUCCESS_TIMEOUT_MS = 10000;
const RESET_AFTER_ERROR_TIMEOUT_MS = 10000;

enum ButtonStatus {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

interface PanelSubmitButtonProps {
  errors: ErrorState;
  setErrors: React.Dispatch<React.SetStateAction<ErrorState>>;
  // TODO(@lberg): this should probably just be the latter
  processClickCb: () => void | Promise<void>;
  buttonTextCb: (isLoading: boolean) => string;
  isDisabled?: boolean;
  sx?: SxProps;
}

export const PanelSubmitButton = ({
  errors,
  setErrors,
  processClickCb,
  buttonTextCb,
  isDisabled,
  sx,
}: PanelSubmitButtonProps) => {
  const [status, setStatus] = useState<ButtonStatus>(ButtonStatus.INITIAL);

  const resetCb = useCallback(() => {
    setStatus(ButtonStatus.INITIAL);
    setErrors((prevState) => ({ ...prevState, isSubmitError: false }));
  }, [setStatus, setErrors]);

  async function handleClick(cb: () => void | Promise<void>) {
    // Don't allow multiple clicks
    if (status == ButtonStatus.LOADING || errors.isSubmitError) {
      return;
    }
    try {
      setStatus(ButtonStatus.LOADING);
      setErrors((prevState) => ({ ...prevState, isSubmitError: false }));
      await cb();
      setStatus(ButtonStatus.SUCCESS);
      // After some time reset status
      setTimeout(() => resetCb(), RESET_AFTER_SUCCESS_TIMEOUT_MS);
    } catch (ex) {
      console.error(ex);
      setErrors((prevState) => ({
        ...prevState,
        isSubmitError: true,
        errorMessage: "Error",
      }));
      // Clear the error after some time
      setTimeout(() => resetCb(), RESET_AFTER_ERROR_TIMEOUT_MS);
    }
  }

  return (
    <Button
      color={errors.isSubmitError ? "error" : "secondary"}
      disabled={
        isDisabled !== undefined
          ? isDisabled
          : errors.isStartTimeInvalid || errors.isEndTimeInvalid
      }
      variant="contained"
      sx={{
        borderRadius: "0.3rem",
        width: "100%",
        ...sx,
      }}
      onClick={async () => await handleClick(processClickCb)}
    >
      <Stack direction="row" gap={2} alignItems="center">
        {status == ButtonStatus.LOADING && (
          <CircularProgress size={18} sx={{ color: "white" }} />
        )}
        {errors.isSubmitError && (
          <ErrorOutlineOutlinedIcon sx={{ color: "white" }} />
        )}
        {status == ButtonStatus.SUCCESS && (
          <CheckOutlineOutlinedIcon sx={{ color: "white" }} />
        )}
        <Typography variant="body2">
          {buttonTextCb(status == ButtonStatus.LOADING)}
        </Typography>
      </Stack>
    </Button>
  );
};
