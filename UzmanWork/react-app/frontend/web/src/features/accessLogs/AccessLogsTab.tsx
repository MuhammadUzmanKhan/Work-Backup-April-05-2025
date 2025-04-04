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
import { AccessLogsResponse, DEFAULT_TIMEZONE } from "coram-common-utils";
import {
  Paginator,
  PaginationData,
  ITEMS_PER_PAGE,
} from "components/devices/PaginationUtils";
import { SearchInput } from "components/devices/SearchInput";
import { LoadingBox } from "components/video/LoadingBox";
import { useMemo, useState } from "react";
import { useAccessLogs } from "utils/globals";
import { AccessLogTableRow } from "./components";
import { DateTime } from "luxon";
import { DateRangeSelectors } from "components/common/DateRangeSelectors";
import { useAccessLogCamerasInfoMap } from "./hooks";

const INITIAL_PAGINATION_DATA = {
  page: 0,
  itemsPerPage: ITEMS_PER_PAGE[0],
};

export function AccessLogsTab() {
  const [searchInput, setSearchInput] = useState<string>("");
  const [timeRange, setTimeRange] = useState({
    timeStart: DateTime.now().minus({ days: 1 }),
    timeEnd: DateTime.now(),
  });
  const { data: logsList, isLoading: logsLoading } = useAccessLogs({
    startTime: timeRange.timeStart,
    endTime: timeRange.timeEnd,
  });
  const pageLogResponses = useMemo(
    () =>
      logsList
        .sort((log1, log2) => (log1.timestamp > log2.timestamp ? -1 : 1))
        .filter((log: AccessLogsResponse) => {
          if (searchInput === "") return true;
          const searchInputLower = searchInput.toLowerCase();
          return (
            log.user_email.toLowerCase().includes(searchInputLower) ||
            log.ip_address.toLowerCase().includes(searchInputLower) ||
            log.action.toLowerCase().includes(searchInputLower) ||
            DateTime.fromISO(log.timestamp)
              .toLocaleString(DateTime.DATETIME_FULL)
              .toLowerCase()
              .includes(searchInputLower) ||
            JSON.stringify(log.details).toLowerCase().includes(searchInputLower)
          );
        }),
    [logsList, searchInput]
  );
  const [paginationData, setPaginationData] = useState<PaginationData>(
    INITIAL_PAGINATION_DATA
  );

  const camerasInfoMap = useAccessLogCamerasInfoMap();

  return (
    <Stack spacing={2} p={3}>
      <Typography variant="h2">Access Logs</Typography>
      <Stack direction="row" justifyContent="space-between">
        <DateRangeSelectors
          timezone={DEFAULT_TIMEZONE}
          timeInterval={timeRange}
          setTimeInterval={(timeInterval) => setTimeRange({ ...timeInterval })}
        />
        <SearchInput
          placeHolder={"Search by user/activity/time"}
          value={searchInput}
          onChange={(value) => {
            setSearchInput(value);
          }}
          sx={{
            width: "20rem",
          }}
        />
      </Stack>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: "100%" }}>
          <TableHead>
            <TableRow>
              <TableCell width="26%">Time</TableCell>
              <TableCell width="34%">Member</TableCell>
              <TableCell width="40%">Activity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsLoading ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <LoadingBox />
                </TableCell>
              </TableRow>
            ) : (
              pageLogResponses
                .slice(
                  paginationData.page * paginationData.itemsPerPage,
                  (paginationData.page + 1) * paginationData.itemsPerPage
                )
                .map((log: AccessLogsResponse) => (
                  <AccessLogTableRow
                    log={log}
                    key={log.timestamp}
                    camerasInfoMap={camerasInfoMap}
                  />
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Paginator
        numItems={pageLogResponses.length}
        paginationData={paginationData}
        setItemsPerPage={(itemsPerPage) =>
          setPaginationData({
            page: 0,
            itemsPerPage,
          })
        }
        setPage={(page) =>
          setPaginationData((prev) => ({ ...prev, page: page }))
        }
      />
    </Stack>
  );
}
