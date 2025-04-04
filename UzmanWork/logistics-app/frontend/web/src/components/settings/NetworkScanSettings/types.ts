import {
  NetworkScanAuto,
  NetworkScanManual,
  NetworkScanScheduled,
} from "coram-common-utils";

export type NetworkScanSettings =
  | NetworkScanScheduled
  | NetworkScanAuto
  | NetworkScanManual;
