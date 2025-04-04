import { Stack, Typography, Divider } from "@mui/material";
import { NVRResponse } from "coram-common-utils";

interface NvrsTableLabelProps {
  nvrs: NVRResponse[];
  onNvrsClick: () => void;
  onOnlineNvrsClick: () => void;
  onOfflineNvrsClick: () => void;
}

export function NvrsTableLabel({
  nvrs,
  onNvrsClick,
  onOnlineNvrsClick,
  onOfflineNvrsClick,
}: NvrsTableLabelProps) {
  const totalNvrs = nvrs.length;
  const onlineNvrs = nvrs.filter((nvr) => nvr.is_online).length;
  const offlineNvrs = totalNvrs - onlineNvrs;
  return (
    <Stack spacing={1} alignItems="start">
      <Typography
        variant="h2"
        onClick={onNvrsClick}
      >{`Appliances (${totalNvrs})`}</Typography>
      <Stack direction="row" spacing={1}>
        <Typography
          variant="body2"
          onClick={onOnlineNvrsClick}
        >{`${onlineNvrs} Active`}</Typography>
        <Divider orientation="vertical" />
        <Typography
          variant="body2"
          onClick={onOfflineNvrsClick}
        >{`${offlineNvrs} Offline`}</Typography>
      </Stack>
    </Stack>
  );
}
