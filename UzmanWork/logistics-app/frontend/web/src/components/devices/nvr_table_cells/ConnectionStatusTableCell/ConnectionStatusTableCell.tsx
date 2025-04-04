import { TableCell } from "@mui/material";
import {
  type InternetStatus,
  type NvrKvsConnectionStatus,
} from "coram-common-utils";
import { OfflineStatus, OnlineStatus } from "./components";

interface ConnectionStatusTableCellProps {
  isOnline: boolean;
  lastSeenTime: string | undefined;
  internetStatus: InternetStatus | undefined;
  kvsConnectionStatus: NvrKvsConnectionStatus | undefined;
  timezone: string;
}

export function ConnectionStatusTableCell({
  isOnline,
  lastSeenTime,
  internetStatus,
  kvsConnectionStatus,
  timezone,
}: ConnectionStatusTableCellProps) {
  return (
    <TableCell>
      {isOnline ? (
        <OnlineStatus
          internetStatus={internetStatus}
          kvsConnectionStatus={kvsConnectionStatus}
          timezone={timezone}
        />
      ) : (
        <OfflineStatus lastSeenTime={lastSeenTime} timezone={timezone} />
      )}
    </TableCell>
  );
}
