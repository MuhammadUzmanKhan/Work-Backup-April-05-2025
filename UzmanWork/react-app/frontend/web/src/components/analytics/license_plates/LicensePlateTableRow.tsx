import { TableCell } from "@mui/material";
import { LicensePlateCell } from "./LicensePlateCell";
import { DateTime } from "luxon";
import { LicensePlateResponse } from "coram-common-utils";

interface LicensePlateTableRowProps {
  item: LicensePlateResponse;
  setSelectedLicensePlate: (selectedLicensePlate: LicensePlateResponse) => void;
  onDelete?: VoidFunction;
}

export function LicensePlateTableRow({
  item,
  setSelectedLicensePlate,
  onDelete,
}: LicensePlateTableRowProps) {
  return (
    <>
      <TableCell sx={{ minWidth: "300px" }}>
        <LicensePlateCell
          licensePlate={item}
          setSelectedLicensePlate={setSelectedLicensePlate}
          onDelete={onDelete}
        />
      </TableCell>
      <TableCell sx={{ maxWidth: "150px" }}>
        {DateTime.fromISO(item.license_plate.last_seen).toLocaleString(
          DateTime.DATETIME_MED
        )}
      </TableCell>
      <TableCell sx={{ maxWidth: "40px" }}>
        {item.license_plate.num_occurrences}
      </TableCell>
      <TableCell sx={{ minWidth: "150px" }}>
        {item.license_plate.location_name}
      </TableCell>
      <TableCell sx={{ minWidth: "150px" }}>
        {item.license_plate.camera_name}
      </TableCell>
    </>
  );
}
