import { isDefined, MountIf, NVRResponse } from "coram-common-utils";
import { DrawerWithHeader } from "components/common";
import { Typography } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import {
  LockSlotsUpdater,
  NvrRemoveButton,
  NvrRetentionUpdater,
} from "./components";
import { UNASSIGNED_TENANT } from "features/administration/consts";

interface NVRSettingsDrawerProps {
  nvr: NVRResponse | null;
  refetchNvrs: () => Promise<unknown>;
  onClose: VoidFunction;
}

export function NVRSettingsDrawer({
  nvr,
  refetchNvrs,
  onClose,
}: NVRSettingsDrawerProps) {
  return (
    <DrawerWithHeader
      title={`${nvr?.uuid}`}
      open={Boolean(nvr)}
      onClose={onClose}
      width="30rem"
    >
      {isDefined(nvr) && (
        <NVRSettingsDrawerBody
          nvr={nvr}
          refetchNvrs={refetchNvrs}
          onClose={onClose}
        />
      )}
    </DrawerWithHeader>
  );
}

interface NVRSettingsDrawerBodyProps {
  nvr: NVRResponse;
  refetchNvrs: () => Promise<unknown>;
  onClose: VoidFunction;
}

function NVRSettingsDrawerBody({
  nvr,
  refetchNvrs,
  onClose,
}: NVRSettingsDrawerBodyProps) {
  return (
    <Grid container spacing={2} width="100%" m={0}>
      <Grid
        xs={6}
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <Typography variant="body1" color="textSecondary">
          Days of Retention
        </Typography>
      </Grid>
      <Grid xs={6} display="flex" justifyContent="end">
        <NvrRetentionUpdater
          nvr_uuid={nvr.uuid}
          retention_days={nvr.retention_days}
          refetchNvrs={refetchNvrs}
        />
      </Grid>
      <LockSlotsUpdater
        nvrUuid={nvr.uuid}
        numSlots={nvr.max_cameras_slots}
        refetchNvrs={refetchNvrs}
      />
      <MountIf condition={nvr.org_tenant !== UNASSIGNED_TENANT}>
        <Grid
          xs={6}
          display="flex"
          flexDirection="column"
          justifyContent="center"
        >
          <Typography variant="body1" color="textSecondary">
            Remove from Organisation
          </Typography>
        </Grid>
        <Grid xs={6} display="flex" justifyContent="end">
          <NvrRemoveButton
            nvrUuid={nvr.uuid}
            refetchNvrs={async () => {
              onClose();
              await refetchNvrs();
            }}
          />
        </Grid>
      </MountIf>
    </Grid>
  );
}
