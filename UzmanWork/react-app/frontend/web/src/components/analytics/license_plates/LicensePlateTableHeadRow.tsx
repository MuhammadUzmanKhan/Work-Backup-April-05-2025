import { Typography } from "@mui/material";
import { SortHeadCell } from "components/SortHeadCell";
import { Sortable } from "utils/sortable";
import { LicensePlateTableSortKeys } from "./LicensePlateTab";

interface LicensePlateTableHeadRowProps {
  sortable: Sortable<LicensePlateTableSortKeys>;
}

export function LicensePlateTableHeadRow({
  sortable,
}: LicensePlateTableHeadRowProps) {
  const sortKeys = {
    plate: "License Plate",
    last_seen: "Last Seen",
    sightings: "Sightings",
    location: "Location",
    camera: "Camera",
  };

  return (
    <>
      {Object.entries(sortKeys).map(([key, label]) => (
        <SortHeadCell<LicensePlateTableSortKeys>
          key={key}
          sortKey={key as LicensePlateTableSortKeys}
          sortable={sortable}
        >
          <Typography variant="body2" marginLeft={1}>
            {label}
          </Typography>
        </SortHeadCell>
      ))}
    </>
  );
}
