import {
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { AugumentedAccessPointEventResponse } from "features/accessControl/types";
import { EventTableRow } from "./EventTableRow";
import { getEventId } from "../../utils";
import { NoResultFoundPlaceholder } from "components/common";
import { SortHeadCell } from "components/SortHeadCell";
import { Sortable } from "utils/sortable";
import { AccessControlEventsSortKeys } from "../../hooks";

export interface EventsTableProps {
  events: AugumentedAccessPointEventResponse[];
  sortable: Sortable<AccessControlEventsSortKeys>;
  isLoadingData: boolean;
}

export function EventsTable({
  events,
  sortable,
  isLoadingData,
}: EventsTableProps) {
  return (
    <TableContainer component={Paper} sx={{ height: "72vh" }}>
      <Table stickyHeader sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell>Access Control</TableCell>
            <SortHeadCell<AccessControlEventsSortKeys>
              sortKey="time"
              sortable={sortable}
            >
              Time
            </SortHeadCell>
            <TableCell>Event</TableCell>
            <SortHeadCell<AccessControlEventsSortKeys>
              sortKey="actor"
              sortable={sortable}
            >
              Identified User/ ID
            </SortHeadCell>
            <TableCell>Clips</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoadingData ? (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ border: "none" }}>
                <Stack padding="28vh 0" alignItems="center">
                  <CircularProgress color="secondary" />
                </Stack>
              </TableCell>
            </TableRow>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventTableRow key={getEventId(event)} event={event} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center" sx={{ border: "none" }}>
                <NoResultFoundPlaceholder
                  padding="26vh 0"
                  alignItems="center"
                  text="No events found. Consider changing the date or modifying the search filter."
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
