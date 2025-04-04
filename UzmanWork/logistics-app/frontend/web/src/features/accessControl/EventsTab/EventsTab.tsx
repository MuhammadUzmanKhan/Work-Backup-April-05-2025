import { Stack } from "@mui/material";
import { EventsTable } from "./components";
import { SearchInput } from "components/devices/SearchInput";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { DEFAULT_TIMEZONE } from "coram-common-utils";
import {
  AccessControlEventsSortKeys,
  useAccessControlEventsWithCameras,
} from "./hooks";
import {
  ITEMS_PER_PAGE,
  PaginationData,
  Paginator,
} from "components/devices/PaginationUtils";
import { DatePicker } from "@mui/x-date-pickers";
import { useSortable } from "utils/sortable";
import { TimeInterval } from "utils/time";
import { useDebounce } from "hooks/calls_limit";

const INITIAL_PAGINATION_DATA = {
  page: 0,
  itemsPerPage: ITEMS_PER_PAGE[0],
};

export function EventsTab() {
  const [pagination, setPagination] = useState<PaginationData>(
    INITIAL_PAGINATION_DATA
  );

  const [date, setDate] = useState(DateTime.now().setZone(DEFAULT_TIMEZONE));
  const timeInterval: TimeInterval = useMemo(
    () => ({
      timeStart: date.startOf("day"),
      timeEnd: date.endOf("day"),
    }),
    [date]
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500, () => {
    setPagination((state) => ({ ...state, page: 0 }));
  });

  const sortable = useSortable<AccessControlEventsSortKeys>("time", "desc");

  const { isLoading, events, total } = useAccessControlEventsWithCameras({
    searchQuery: debouncedSearchQuery,
    timeInterval,
    sortable,
    pagination,
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  function handleDateChange(date: DateTime | null) {
    if (!date) {
      return;
    }
    setDate(date.setZone(DEFAULT_TIMEZONE));
    setPagination({ ...pagination, page: 0 });
  }

  return (
    <>
      <Stack direction="row" justifyContent="space-between">
        <DatePicker
          open={datePickerOpen}
          onClose={() => setDatePickerOpen(false)}
          maxDate={DateTime.now().setZone(DEFAULT_TIMEZONE)}
          minDate={DateTime.now()
            .setZone(DEFAULT_TIMEZONE)
            .minus({ months: 3 })}
          value={date}
          onChange={handleDateChange}
          sx={{
            maxWidth: "146px",
            "& input": {
              padding: "10.3px 8.7px",
            },
          }}
          slotProps={{
            field: {
              readOnly: true,
            },
            textField: {
              onClick: () => setDatePickerOpen(true),
            },
          }}
        />
        <SearchInput
          placeHolder="Search"
          value={searchQuery}
          onChange={(value) => setSearchQuery(value)}
          sx={{
            minWidth: "20rem",
          }}
        />
      </Stack>
      <EventsTable
        events={events}
        sortable={sortable}
        isLoadingData={isLoading}
      />
      <Paginator
        numItems={total}
        paginationData={pagination}
        setPage={(page) => setPagination({ ...pagination, page })}
        setItemsPerPage={(itemsPerPage) =>
          setPagination({ ...pagination, itemsPerPage, page: 0 })
        }
      />
    </>
  );
}
