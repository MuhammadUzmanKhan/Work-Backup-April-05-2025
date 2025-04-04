import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { TimezoneTableRow } from "./TimezoneTableRow";
import { useMemo } from "react";
import { useLocations } from "coram-common-utils";

export function TimezoneTab() {
  const { data: locations, refetch: refetchLocations } = useLocations();

  const sortedLocations = useMemo(() => {
    return [...locations.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  return (
    <TableContainer sx={{ py: 4, px: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ "& th": { paddingY: "0.4rem" } }}>
            <TableCell width="32%">
              <Typography variant="body2">Location</Typography>
            </TableCell>
            <TableCell width="44%">
              <Typography variant="body2">Timezone</Typography>
            </TableCell>
            <TableCell width="24%">
              <Typography variant="body2">Automatic Time Management</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedLocations.map((location) => (
            <TimezoneTableRow
              key={location.id}
              location={location}
              onChange={refetchLocations}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
