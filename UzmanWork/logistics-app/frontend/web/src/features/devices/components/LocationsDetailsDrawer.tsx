import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DrawerWithHeader } from "components/common";
import { NVRResponse } from "coram-common-utils";
import { DateTime } from "luxon";
import {
  OfflineIcon,
  OnlineIcon,
} from "../../../components/devices/cameras_table_cells/StatusCell";
interface LocationsDetailsDrawerProps {
  open: boolean;
  onClose: VoidFunction;
  nvrs: NVRResponse[];
}

export function LocationsDetailsDrawer({
  open,
  onClose,
  nvrs,
}: LocationsDetailsDrawerProps) {
  return (
    <DrawerWithHeader
      title="Appliances"
      open={open}
      onClose={onClose}
      width="25.5rem"
    >
      <TableContainer component={Paper}>
        <Table
          stickyHeader
          sx={{
            minWidth: "100%",
            tableLayout: "fixed",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="body2">Appliances</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">Last Seen</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nvrs.map((nvr, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Stack direction="row" alignItems="center" gap={1}>
                    {nvr.is_online ? <OnlineIcon /> : <OfflineIcon />}
                    <Typography variant="body2">{nvr.uuid}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {nvr.last_seen_time &&
                    DateTime.fromISO(nvr.last_seen_time).toFormat(
                      "dd/MM/yy, hh:mm a"
                    )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </DrawerWithHeader>
  );
}
