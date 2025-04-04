import { useContext, useEffect, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { Stack, TextField, Tooltip, Typography } from "@mui/material";
import { useMutateHasLockSlots, useNvrHasLockSlots } from "../hooks";
import { LoadingButton } from "@mui/lab";
import { NVRSlotsLock, NVRSlotsUnlock } from "coram-common-utils";
import { InfoOutlined as InfoOutlinedIcon } from "@mui/icons-material";
import Grid from "@mui/material/Unstable_Grid2";
import { useIsUserDeviceManager } from "features/administration/hooks";

interface LockSlotsUpdaterProps {
  nvrUuid: string;
  numSlots: number;
  refetchNvrs: () => Promise<unknown>;
}

export function LockSlotsUpdater({
  nvrUuid,
  numSlots,
  refetchNvrs,
}: LockSlotsUpdaterProps) {
  const isDeviceManager = useIsUserDeviceManager();

  const { data: hasLockSlots, refetch: refetchLock } =
    useNvrHasLockSlots(nvrUuid);

  const [localNumSlots, setLocalNumSlots] = useState<number>(numSlots);

  useEffect(() => {
    setLocalNumSlots(numSlots);
  }, [numSlots]);

  const { setNotificationData } = useContext(NotificationContext);

  const { isLoading, mutateAsync } = useMutateHasLockSlots({
    onSuccess: async () => {
      await refetchNvrs();
      refetchLock();
      setNotificationData({
        message: "Slots has been successfully changed",
        severity: "success",
      });
    },
    onError: async (err) => {
      await refetchNvrs();
      refetchLock();
      console.error(err);
      setNotificationData({
        message: "Failed to change slots state",
        severity: "error",
      });
    },
  });

  const placeholderNumCameras = `Max number of cameras for this NVR: ${numSlots}`;

  const isInvalidNumSlots = localNumSlots < 1;

  async function handleLockUnlock() {
    const action = hasLockSlots
      ? {
          nvr_uuid: nvrUuid,
          action: NVRSlotsUnlock.action.UNLOCK,
        }
      : {
          nvr_uuid: nvrUuid,
          num_slots: localNumSlots,
          action: NVRSlotsLock.action.LOCK,
        };
    await mutateAsync(action);
  }

  return (
    <>
      <Grid
        xs={6}
        display="flex"
        flexDirection="column"
        justifyContent="center"
      >
        <Typography
          variant="body1"
          color="textSecondary"
          display="flex"
          gap={1}
          alignItems="center"
        >
          Max Cameras Allowed
          <Tooltip
            title={
              <Stack direction="column" gap={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Enforce the max number of cameras for this NVR
                </Typography>
                <Typography variant="body3" color="text.secondary">
                  {hasLockSlots
                    ? `${placeholderNumCameras} (Locked by user)`
                    : `${placeholderNumCameras} (Set by the NVR)`}
                </Typography>
              </Stack>
            }
          >
            <InfoOutlinedIcon sx={{ color: "#3C3E49", fontSize: "medium" }} />
          </Tooltip>
        </Typography>
      </Grid>
      <Grid xs={6} display="flex">
        <Stack direction="row" gap={1}>
          <TextField
            variant="outlined"
            type="number"
            value={localNumSlots}
            disabled={hasLockSlots || !isDeviceManager}
            onChange={(e) => setLocalNumSlots(Number(e.target.value))}
            error={isInvalidNumSlots}
            helperText={
              isInvalidNumSlots && (
                <Typography variant="body2" position="absolute">
                  Slots must be greater than 0
                </Typography>
              )
            }
            FormHelperTextProps={{ sx: { marginLeft: 0 } }}
            fullWidth
            sx={{
              input: {
                paddingY: "0.6rem",
              },
            }}
          />
          <LoadingButton
            loading={isLoading}
            variant="outlined"
            color="info"
            disabled={isInvalidNumSlots || !isDeviceManager}
            size="small"
            onClick={handleLockUnlock}
            sx={{
              minWidth: "5.6rem",
              maxHeight: "36px",
              borderRadius: "4px",
              paddingY: 0,
            }}
          >
            {hasLockSlots ? "Unlock" : "Lock"}
          </LoadingButton>
        </Stack>
      </Grid>
    </>
  );
}
