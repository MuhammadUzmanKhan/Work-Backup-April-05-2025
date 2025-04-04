import { FaceService } from "coram-common-utils";
import { useMutation } from "react-query";

export function useUploadImage({
  onError,
  onSuccess,
}: {
  onError: (error: unknown) => void;
  onSuccess: () => void;
}) {
  return useMutation(
    async ({ file, profileName }: { file: File; profileName: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      await FaceService.uploadFacePicture({
        profile_name: profileName,
        file: file,
      });
    },
    {
      onError: (error) => onError(error),
      onSuccess: () => onSuccess(),
    }
  );
}
