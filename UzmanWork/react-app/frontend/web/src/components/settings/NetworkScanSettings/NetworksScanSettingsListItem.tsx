import {
  Divider,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { WifiFind as WifiFindIcon } from "@mui/icons-material";
import { CustomAvatar } from "../OrgFlagListItem";
import { useState } from "react";
import {
  NetworkScanAuto,
  NetworkScanManual,
  NetworkScanScheduled,
} from "coram-common-utils";
import { CollapsableText } from "../CollapsableText";
import { hashQueryKey } from "react-query";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { confirm } from "utils/confirm";
import { LoadingButton } from "@mui/lab";
import { ScheduleUpdater } from "./ScanScheduleUpdate";
import {
  DEFAULT_NETWORK_SCAN_SETTINGS,
  DEFAULT_SCHEDULED_SCAN_SETTINGS,
} from "./constants";
import { useNetworkScanSettings, useMutateNetworkScanSettings } from "./hooks";
import { NetworkScanSettings } from "./types";

export function NetworkScanSettingsListItem() {
  const [localNetworkScanSettings, setLocalNetworkScanSettings] =
    useState<NetworkScanSettings>(DEFAULT_NETWORK_SCAN_SETTINGS);
  const { data: networkScanSettings } = useNetworkScanSettings({
    onSuccess: setLocalNetworkScanSettings,
  });
  const { mutateAsync: updateNetworkScanSettings, isLoading } =
    useMutateNetworkScanSettings();

  function onSelectChange(e: SelectChangeEvent<unknown>) {
    const mode = e.target.value;
    if (mode == networkScanSettings.mode) {
      setLocalNetworkScanSettings({ ...networkScanSettings });
      return;
    }

    if (mode === NetworkScanAuto.mode.AUTO) {
      setLocalNetworkScanSettings({ mode: NetworkScanAuto.mode.AUTO });
    } else if (mode === NetworkScanManual.mode.MANUAL) {
      setLocalNetworkScanSettings({ mode: NetworkScanManual.mode.MANUAL });
    } else if (mode === NetworkScanScheduled.mode.SCHEDULED) {
      setLocalNetworkScanSettings(DEFAULT_SCHEDULED_SCAN_SETTINGS);
    }
  }

  const isSameSettings =
    hashQueryKey([networkScanSettings]) ===
    hashQueryKey([localNetworkScanSettings]);

  return (
    <>
      <ListItem sx={{ px: 0, py: 1 }} alignItems="flex-start">
        <ListItemAvatar>
          <CustomAvatar sx={{ mr: "1rem" }}>
            <WifiFindIcon color="action" />
          </CustomAvatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="h2">Set Network Scan Settings</Typography>
          }
          secondaryTypographyProps={{ component: "div", pt: 1 }}
          secondary={
            <Stack gap={1} alignItems="start" direction="column">
              <CollapsableText
                text="Customize how CoramAI devices scan the network for new cameras. Note that scanning the network is also required to detect new IPs for existing cameras if the IP changes."
                numWordsLimit={20}
              />
              <Stack direction="row" alignItems="start" gap={3}>
                <StyledSelect
                  sx={{ maxWidth: "15rem" }}
                  value={localNetworkScanSettings.mode}
                  onChange={(e) => onSelectChange(e)}
                >
                  <MenuItem value={NetworkScanAuto.mode.AUTO}>
                    Automatic (The network will be scanned automatically)
                  </MenuItem>
                  <MenuItem value={NetworkScanManual.mode.MANUAL}>
                    Manual (The network scan will only be triggered when
                    actively searching for cameras in the device page)
                  </MenuItem>
                  <MenuItem value={NetworkScanScheduled.mode.SCHEDULED}>
                    Scheduled (The network will be automatically scanned only in
                    the specified time range and days of the week, manual scans
                    are always allowed)
                  </MenuItem>
                </StyledSelect>
                {localNetworkScanSettings.mode ===
                  NetworkScanScheduled.mode.SCHEDULED && (
                  <ScheduleUpdater
                    networkScanSettings={localNetworkScanSettings}
                    setLocalNetworkScanSettings={setLocalNetworkScanSettings}
                  />
                )}
                <LoadingButton
                  loading={isLoading}
                  disabled={isSameSettings}
                  color="secondary"
                  sx={{
                    borderRadius: "0.2rem",
                    minWidth: "6.5rem",
                  }}
                  variant="contained"
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      confirmText:
                        "Are you sure you want to change the network scan settings?",
                      yesText: "Yes, apply the new setting",
                      noText: "No, keep the setting",
                    });
                    if (!isConfirmed) {
                      return;
                    }
                    await updateNetworkScanSettings({
                      network_scan_settings: localNetworkScanSettings,
                    });
                  }}
                >
                  Update
                </LoadingButton>
              </Stack>
            </Stack>
          }
        />
      </ListItem>
      <Divider variant="fullWidth" component="li" />
    </>
  );
}
