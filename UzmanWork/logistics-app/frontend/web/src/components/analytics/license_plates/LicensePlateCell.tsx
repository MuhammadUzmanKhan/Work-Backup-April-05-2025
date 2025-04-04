import { Stack, Typography } from "@mui/material";
import { LicensePlateImage } from "./LicensePlateImage";
import { VehicleImage } from "./VehicleImage";
import { LicensePlateResponse, isDefined } from "coram-common-utils";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { useRef, useState } from "react";
import { DeleteMenu } from "components/common/DeleteMenu";

interface PlateCellProps {
  licensePlate: LicensePlateResponse;
  setSelectedLicensePlate: (selectedLicensePlate: LicensePlateResponse) => void;
  onDelete?: VoidFunction;
}

export function LicensePlateCell({
  licensePlate,
  setSelectedLicensePlate,
  onDelete,
}: PlateCellProps) {
  const anchorEl = useRef(null);
  const [deleteMenuOpen, setDeleteMenuOpen] = useState(false);
  return (
    <Stack direction="row" alignItems="center" gap={2}>
      <LicensePlateImage
        licensePlateData={licensePlate}
        onClick={() => {
          setSelectedLicensePlate(licensePlate);
        }}
        boxWidth={100}
        boxHeight={50}
      />
      <VehicleImage
        src={licensePlate.s3_signed_url}
        style={{ width: "100px", height: "50px" }}
        onClick={() => {
          setSelectedLicensePlate(licensePlate);
        }}
      />
      {licensePlate && (
        <Typography variant="body2">
          {licensePlate.license_plate.license_plate_number}
        </Typography>
      )}
      {isDefined(onDelete) && (
        <>
          <MoreVertIcon
            ref={anchorEl}
            onClick={() => setDeleteMenuOpen(true)}
            sx={{ fontSize: "1.2rem", marginLeft: "auto" }}
          />

          <DeleteMenu
            anchorEl={anchorEl.current}
            open={deleteMenuOpen}
            deleteLabel="Remove from License Plate of Interest"
            setMenuOpen={setDeleteMenuOpen}
            onClose={() => setDeleteMenuOpen(false)}
            onDelete={onDelete}
          />
        </>
      )}
    </Stack>
  );
}
