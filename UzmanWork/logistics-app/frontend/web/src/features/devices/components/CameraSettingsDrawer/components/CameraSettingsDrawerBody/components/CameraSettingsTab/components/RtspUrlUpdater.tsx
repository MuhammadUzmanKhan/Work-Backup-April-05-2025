import { LoadingButton } from "@mui/lab";
import { Stack, TextField, Typography } from "@mui/material";
import { DevicesService, isDefined } from "coram-common-utils";
import { useState } from "react";
import { useMutation } from "react-query";
import { OpenInNew as OpenInNewIcon } from "@mui/icons-material";
import { ActionButton } from "components/styled_components/ActionButton";

const HELP_URL =
  "https://help.coram.ai/en/articles/9047706-add-custom-rtsp-url";

export function RtspUrlUpdater({
  macAddress,
  rtspUrl,
  onRtspUrlChange,
}: {
  macAddress: string;
  rtspUrl?: string;
  onRtspUrlChange: (rtspUrl?: string) => void;
}) {
  const [localRtspUrl, setLocalRtspUrl] = useState(rtspUrl);
  const isEnforced = isDefined(rtspUrl);

  const { mutateAsync: updateRtspUrl, isLoading } = useMutation(
    async () => {
      await DevicesService.updateCameraRtspUrl({
        mac_address: macAddress,
        rtsp_url: localRtspUrl,
      });
    },
    {
      onSuccess: () => {
        onRtspUrlChange(localRtspUrl);
      },
    }
  );
  const isInvalidRtspUrl =
    isDefined(localRtspUrl) && !localRtspUrl.startsWith("/");

  return (
    <Stack gap={1}>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Rtsp URL
        </Typography>
        <ActionButton color="secondary" onClick={() => window.open(HELP_URL)}>
          <OpenInNewIcon sx={{ fontSize: 16 }} />
        </ActionButton>
      </Stack>
      <Stack direction="row" gap={1}>
        <TextField
          variant="outlined"
          placeholder={
            isEnforced
              ? "Camera is using a custom RTSP URL."
              : "Camera is not using a custom RTSP URL."
          }
          value={isDefined(localRtspUrl) ? localRtspUrl : ""}
          onChange={(e) =>
            setLocalRtspUrl(e.target.value === "" ? undefined : e.target.value)
          }
          error={isInvalidRtspUrl}
          helperText={
            isInvalidRtspUrl && (
              <Typography variant="body2">URL must begin with /</Typography>
            )
          }
          FormHelperTextProps={{ sx: { marginLeft: 0 } }}
          fullWidth
          sx={{
            input: {
              paddingY: "0.4rem",
            },
          }}
        />
        <LoadingButton
          loading={isLoading}
          variant="outlined"
          color="info"
          disabled={localRtspUrl === rtspUrl || isInvalidRtspUrl}
          size="small"
          onClick={async () => await updateRtspUrl()}
          sx={{
            minWidth: "5.6rem",
            maxHeight: "30px",
            borderRadius: "4px",
            paddingY: 0,
          }}
        >
          Set
        </LoadingButton>
      </Stack>
    </Stack>
  );
}
