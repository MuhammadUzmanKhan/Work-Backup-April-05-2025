import { CircularProgress, Stack, Tooltip, Typography } from "@mui/material";
import {
  ArrowCircleDown as ArrowCircleDownIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { initiateFileDownload } from "utils/file_save";

interface DownloadButtonProps {
  disabled?: boolean;
  urlAndFileNameCb: () => Promise<{ url: string; fileName: string }>;
  enabledTooltip: string;
  disabledTooltip: string;
  color?: string;
}

export function DownloadButton({
  disabled,
  urlAndFileNameCb,
  enabledTooltip,
  disabledTooltip,
  color,
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  return (
    <Stack
      gap={0.4}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        color: disabled || isLoading ? "neutral.300" : color,
      }}
      onClick={async () => {
        if (disabled || isLoading) {
          return;
        }
        try {
          setIsLoading(true);
          setIsError(false);
          const { url, fileName } = await urlAndFileNameCb();
          await initiateFileDownload(url, fileName);
        } catch (ex) {
          console.error(ex);
          setIsError(true);
          setTimeout(() => setIsError(false), 4000);
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <Tooltip title={disabled ? disabledTooltip : enabledTooltip}>
        {isLoading ? (
          <CircularProgress size={24} color="secondary" />
        ) : (
          <ArrowCircleDownIcon fontSize="medium" />
        )}
      </Tooltip>
      <Typography variant="body2"> Download</Typography>
      {isError ? <ErrorIcon color="error" /> : <></>}
    </Stack>
  );
}
