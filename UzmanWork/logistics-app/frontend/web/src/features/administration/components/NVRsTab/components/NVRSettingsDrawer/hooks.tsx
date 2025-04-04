import { AdminService, NVRSlotsLock, NVRSlotsUnlock } from "coram-common-utils";
import { useMutation, useQuery } from "react-query";

export function useNvrHasLockSlots(nvrUuid: string) {
  const query = useQuery(["nvr_locked_slots", nvrUuid], async () =>
    AdminService.isNvrSlotsLocked(nvrUuid)
  );

  return { ...query, data: query.data ?? false };
}

export function useMutateHasLockSlots({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (err: unknown) => void;
}) {
  return useMutation(
    async (lockAction: NVRSlotsLock | NVRSlotsUnlock) => {
      if (lockAction.action === NVRSlotsLock.action.LOCK) {
        await AdminService.lockNvrSlots(lockAction);
      } else if (lockAction.action === NVRSlotsUnlock.action.UNLOCK) {
        await AdminService.unlockNvrSlots(lockAction);
      }
    },
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (err) => {
        onError(err);
      },
    }
  );
}

export function useUnassignNvr({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (err: unknown) => void;
}) {
  return useMutation(
    async (nvrUuid: string) => {
      await AdminService.unassignNvr(nvrUuid);
    },
    {
      onSuccess: () => {
        onSuccess();
      },
      onError: (err) => {
        onError(err);
      },
    }
  );
}
