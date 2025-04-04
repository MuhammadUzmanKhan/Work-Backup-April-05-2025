import { NotificationContext } from "contexts/notification_context";
import { FaceAlertService } from "coram-common-utils";
import { useContext } from "react";
import { useMutation } from "react-query";

export function useRegisterAlertProfile({
  onError,
  onSettled,
}: {
  onError: VoidFunction;
  onSettled: VoidFunction;
}) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(
    async ({
      orgUniqueFaceId,
      description,
      is_person_of_interest,
    }: {
      orgUniqueFaceId: number;

      description: string;
      is_person_of_interest: boolean;
    }) => {
      await FaceAlertService.registerAlertProfile({
        description: description,
        is_person_of_interest,
        org_unique_face_id: orgUniqueFaceId,
      });
    },
    {
      onError: (error) => {
        setNotificationData({
          message: "Something went wrong. Please try again later!",
          severity: "error",
        });
        console.error(error);
        onError();
      },
      onSettled: onSettled,
    }
  );
}

export function useRegisterPersonOfInterest({
  onSettled,
}: {
  onSettled: VoidFunction;
}) {
  const { setNotificationData } = useContext(NotificationContext);

  return useMutation(
    async ({ faceProfileId }: { faceProfileId: number }) => {
      await await FaceAlertService.updatePersonOfInterestFlag(faceProfileId, {
        is_person_of_interest: true,
      });
    },
    {
      onError: (error) => {
        setNotificationData({
          message: "Something went wrong. Please try again later!",
          severity: "error",
        });
        console.error(error);
      },
      onSettled: onSettled,
    }
  );
}
