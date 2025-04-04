import { useState } from "react";

export type Order = "asc" | "desc";

export interface Sortable<SortableKeys extends string> {
  order: Order;
  setOrder: (order: Order) => void;
  orderBy: SortableKeys;
  setOrderBy: (orderBy: SortableKeys) => void;
}

export function useSortable<SortableKeys>(
  defaultOrderBy: SortableKeys,
  defaultOrder: Order = "asc"
) {
  const [order, setOrder] = useState<Order>(defaultOrder);
  const [orderBy, setOrderBy] = useState<SortableKeys>(defaultOrderBy);

  return {
    order,
    setOrder,
    orderBy,
    setOrderBy,
  };
}

export function sortData<DataType>(
  data: DataType[],
  orderBy: keyof DataType,
  order: Order
): DataType[] {
  return [...data].sort((a, b) => {
    const valueA = a[orderBy] ?? "";
    const valueB = b[orderBy] ?? "";

    if (order === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });
}
