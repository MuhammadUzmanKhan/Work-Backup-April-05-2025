import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useContext } from "react";
import { useLicensePlateRenderData } from "components/devices/utils";
import { PaginationData } from "components/devices/PaginationUtils";
import { SearchFilterContext } from "utils/search_filter";
import { Sortable } from "utils/sortable";
import { LicensePlateResponse } from "coram-common-utils";
import { LicensePlateTableRow } from "./LicensePlateTableRow";
import { LicensePlateTableHeadRow } from "./LicensePlateTableHeadRow";
import { LicensePlateTableSortKeys } from "./LicensePlateTab";

// TODO: add storybook

interface LicensePlateTableProps {
  data: Array<LicensePlateResponse>;
  paginationData: PaginationData;
  setSelectedLicensePlate: (selectedLicensePlate: LicensePlateResponse) => void;
  sortable: Sortable<LicensePlateTableSortKeys>;
}

export function LicensePlateTable({
  data,
  paginationData,
  setSelectedLicensePlate,
  sortable,
}: LicensePlateTableProps) {
  const analyticsFilterContext = useContext(SearchFilterContext);

  const visibleData = useLicensePlateRenderData(
    data,
    paginationData.page,
    paginationData.itemsPerPage,
    sortable.order,
    sortable.orderBy,
    analyticsFilterContext.filter.searchQuery
  );

  return (
    <Stack spacing={2} alignItems="flex-end">
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 250 }}>
          <TableHead>
            <TableRow>
              <LicensePlateTableHeadRow sortable={sortable} />
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleData.map((item) => (
              <TableRow
                key={
                  item.license_plate.license_plate_number +
                  item.license_plate.last_seen
                }
                sx={{
                  "&:last-child td, &:last-child th": { borderBottom: 0 },
                }}
              >
                <LicensePlateTableRow
                  item={item}
                  setSelectedLicensePlate={setSelectedLicensePlate}
                />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
