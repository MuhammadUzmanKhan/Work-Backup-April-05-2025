import { TableCell, TableSortLabel } from "@mui/material";
import { Sortable } from "utils/sortable";
import { ReactNode } from "react";

interface SortHeadCellProps<T extends string> {
  sortKey: T;
  sortable: Sortable<T>;
  children: ReactNode;
}

export const TABLE_HEADER_HEIGHT_PX = 28;

export function SortHeadCell<T extends string>({
  sortKey,
  sortable: { orderBy, order, setOrderBy, setOrder },
  children,
}: SortHeadCellProps<T>) {
  return (
    <TableCell
      height={`${TABLE_HEADER_HEIGHT_PX}px`}
      sortDirection={orderBy === sortKey ? order : false}
    >
      <TableSortLabel
        active={orderBy === sortKey}
        direction={orderBy === sortKey ? order : "asc"}
        onClick={() => {
          setOrder(order === "asc" ? "desc" : "asc");
          setOrderBy(sortKey);
        }}
      >
        {children}
      </TableSortLabel>
    </TableCell>
  );
}
