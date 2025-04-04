import Grid from "@mui/material/Unstable_Grid2";
import { ToggleButton, Typography } from "@mui/material";
import { NetworkInterfaceIcon } from "../icons";
import { isDefined, DATE_WITH_TIME_AND_ZONE } from "coram-common-utils";
import type { NvrNetworkInfo, NvrNetworkInterface } from "coram-common-utils";
import { DateTime } from "luxon";
import { useState } from "react";

interface NVRNetworkInfoProps {
  isNvrOnline: boolean;
  networkInfo: NvrNetworkInfo;
  nvrTimezone: string;
}

export function NVRNetworkInfo({
  isNvrOnline,
  networkInfo,
  nvrTimezone,
}: NVRNetworkInfoProps) {
  const lastScanTime = isDefined(networkInfo)
    ? DateTime.fromISO(networkInfo.last_scan_time, { zone: nvrTimezone })
    : null;

  const isLastScanTimeStale =
    isDefined(lastScanTime) &&
    lastScanTime < DateTime.now().minus({ second: 30 });

  function isNVRNetworkInterfaceActive(
    networkInterface: NvrNetworkInterface
  ): boolean {
    return (
      isNvrOnline &&
      isDefined(networkInterface.ip_address) &&
      !isLastScanTimeStale
    );
  }

  const sortedNetworkInterfaces =
    networkInfo?.network_interfaces?.sort((a, b) => {
      const aActive = isNVRNetworkInterfaceActive(a) ? 1 : 0;
      const bActive = isNVRNetworkInterfaceActive(b) ? 1 : 0;
      if (aActive !== bActive) {
        return bActive - aActive;
      }
      return a.name.localeCompare(b.name);
    }) ?? [];

  const [selectedInterface, setSelectedInterface] =
    useState<NvrNetworkInterface | null>(sortedNetworkInterfaces[0] ?? null);

  return (
    <>
      <Grid container spacing={2} width="100%" m={0}>
        <Grid xs={6}>
          <Typography variant="h3">Network Interfaces</Typography>
        </Grid>
        <Grid xs={6}>
          <Typography variant="body2" display="flex" justifyContent="end">
            updated {lastScanTime?.toFormat(DATE_WITH_TIME_AND_ZONE)}
          </Typography>
        </Grid>
        <Grid xs={12} display="flex" gap={1} alignItems="center">
          {networkInfo.network_interfaces?.map((ni) => (
            <ToggleButton
              key={ni.name}
              value={ni.name}
              selected={ni.name === selectedInterface?.name}
              onChange={() => setSelectedInterface(ni)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "90px",
                height: "104px",
              }}
            >
              <Typography
                variant="body2"
                fontSize="9px"
                overflow="hidden"
                textOverflow="eclipsis"
                textTransform="lowercase"
              >
                {ni.name}
              </Typography>
              <NetworkInterfaceIcon
                active={isNVRNetworkInterfaceActive(ni)}
                sx={{
                  width: "64px",
                  height: "64px",
                }}
              />
            </ToggleButton>
          ))}
        </Grid>
        {isDefined(selectedInterface) && (
          <>
            <Grid xs={8}>
              <Typography variant="body1" color="textSecondary">
                Name
              </Typography>
            </Grid>
            <Grid xs={4} display="flex" justifyContent="end">
              <Typography variant="body1">{selectedInterface.name}</Typography>
            </Grid>
            <Grid xs={8}>
              <Typography variant="body1" color="textSecondary">
                IP Address
              </Typography>
            </Grid>
            <Grid xs={4} display="flex" justifyContent="end">
              <Typography variant="body1">
                {isNVRNetworkInterfaceActive(selectedInterface)
                  ? selectedInterface.ip_address
                  : "N/A"}
              </Typography>
            </Grid>
            <Grid xs={8}>
              <Typography variant="body1" color="textSecondary">
                MAC Address
              </Typography>
            </Grid>
            <Grid xs={4} display="flex" justifyContent="end">
              <Typography variant="body1">
                {selectedInterface.mac_address ?? "N/A"}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
}
