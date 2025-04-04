import { TableCell, TableRow, Typography } from "@mui/material";
import { Location } from "coram-common-utils";
import { SetTimezoneTableCell } from "./SetTimezoneTableCell";
import { TimeManagementTableCell } from "./TimeManagementTableCell";

interface TimezoneTableRowProps {
  location: Location;
  onChange: () => Promise<unknown>;
}

export function TimezoneTableRow({
  location,
  onChange,
}: TimezoneTableRowProps) {
  return (
    <TableRow sx={{ "& td": { border: 1, borderColor: "#DFE0E6" } }}>
      <TableCell>
        <Typography variant="body2">{location.name}</Typography>
      </TableCell>
      <SetTimezoneTableCell location={location} onChange={onChange} />
      <TimeManagementTableCell location={location} onChange={onChange} />
    </TableRow>
  );
}
