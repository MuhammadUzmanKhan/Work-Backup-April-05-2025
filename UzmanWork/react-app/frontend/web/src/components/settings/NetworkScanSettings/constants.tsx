import { NetworkScanAuto, NetworkScanScheduled } from "coram-common-utils";

export const DEFAULT_NETWORK_SCAN_SETTINGS: NetworkScanAuto = {
  mode: NetworkScanAuto.mode.AUTO,
};

export const DEFAULT_SCHEDULED_SCAN_SETTINGS: NetworkScanScheduled = {
  mode: NetworkScanScheduled.mode.SCHEDULED,
  days: [],
  start_time: "00:00",
  end_time: "23:59",
};
