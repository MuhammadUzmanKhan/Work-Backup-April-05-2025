import { isDefined, Organization } from "coram-common-utils";
import { DrawerWithHeader } from "components/common";
import { Stack, Typography } from "@mui/material";

interface NVRSettingsDrawerProps {
  organisation: Organization | null;
  onClose: VoidFunction;
}

export function OrganisationSettingsDrawer({
  organisation,
  onClose,
}: NVRSettingsDrawerProps) {
  return (
    <DrawerWithHeader
      title={`${organisation?.name}`}
      open={Boolean(organisation)}
      onClose={onClose}
      width="22rem"
    >
      {isDefined(organisation) && <OrganisationSettingsDrawerBody />}
    </DrawerWithHeader>
  );
}

function OrganisationSettingsDrawerBody() {
  return (
    <>
      <Stack gap={1}>
        <Typography variant="body1">Not implemented yet</Typography>
      </Stack>
    </>
  );
}
