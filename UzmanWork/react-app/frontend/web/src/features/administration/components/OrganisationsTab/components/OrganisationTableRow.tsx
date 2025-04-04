import { CameraResponse, NVRResponse, Organization } from "coram-common-utils";
import { Button, TableCell, TableRow, Typography } from "@mui/material";
import { UNASSIGNED_TENANT } from "features/administration/consts";

interface OrganisationTableRowProps {
  organisation: Organization;
  nvrs: NVRResponse[];
  cameras: CameraResponse[];
  onOrganisationSettingsClick: (organisation: Organization) => void;
}

export function OrganisationTableRow({
  organisation,
  nvrs,
  cameras,
  onOrganisationSettingsClick,
}: OrganisationTableRowProps) {
  return (
    <>
      <TableRow>
        <TableCell>
          <Typography variant="body2">{organisation.name}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{organisation.tenant}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{nvrs.length}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {nvrs.filter((nvr) => nvr.is_online).length}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{cameras.length}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {cameras.filter((camera) => camera.camera.is_online).length}
          </Typography>
        </TableCell>
        <TableCell>
          <Button
            variant="text"
            onClick={() => onOrganisationSettingsClick(organisation)}
            disabled={organisation.tenant === UNASSIGNED_TENANT}
          >
            Settings
          </Button>
        </TableCell>
      </TableRow>
    </>
  );
}
