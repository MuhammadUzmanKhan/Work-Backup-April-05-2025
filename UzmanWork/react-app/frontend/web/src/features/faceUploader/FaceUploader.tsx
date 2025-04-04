import {
  Box,
  Dialog,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

import { useContext, useState } from "react";
import { useUploadImage } from "./hooks";
import { LoadingButton } from "@mui/lab";
import { NotificationContext } from "contexts/notification_context";
import { isDefined } from "utils/types";
import { UploadBox } from "./components/UploadBox";
import { MAX_FACE_FILE_SIZE_MB } from "./constants";

export interface FaceUploaderDialogProps {
  open: boolean;
  onClose: () => void;
  onProfileUploaded: () => Promise<unknown>;
}

export function FaceUploaderDialog({
  open,
  onClose,
  onProfileUploaded,
}: FaceUploaderDialogProps) {
  const theme = useTheme();
  const { setNotificationData } = useContext(NotificationContext);

  const [file, setFile] = useState<File | null>(null);
  const [profileName, setProfileName] = useState("");

  const { mutateAsync: uploadImage, isLoading } = useUploadImage({
    onError: (error) => {
      console.error(error);
      setNotificationData({
        message: "Failed to upload image",
        severity: "error",
      });
    },
    onSuccess: () => {
      setNotificationData({
        message: "Image uploaded successfully",
        severity: "success",
      });
      setFile(null);
      onClose();
      onProfileUploaded();
    },
  });

  return (
    <Dialog open={open} onClose={onClose}>
      <Box p={2} maxWidth="408px">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h3">Upload Image</Typography>
          <IconButton onClick={onClose} sx={{ p: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Divider sx={{ mx: -2, my: 2 }} />

        <Typography variant="body1" color={theme.palette.text.secondary}>
          Upload a photo that clearly shows the face of one person. Only PNG and
          JPG files are allowed. The file size should not exceed{" "}
          {MAX_FACE_FILE_SIZE_MB}MB.
        </Typography>

        <UploadBox file={file} setFile={setFile} />

        {isDefined(file) && (
          <Stack pt={2} spacing={1.5}>
            <TextField
              placeholder="Enter name"
              sx={{
                input: {
                  height: "0.3rem",
                },
              }}
              onChange={(e) => setProfileName(e.target.value)}
            />
            <LoadingButton
              fullWidth
              disabled={profileName === ""}
              loading={isLoading}
              variant="contained"
              color="secondary"
              onClick={async () =>
                uploadImage({
                  file,
                  profileName,
                })
              }
            >
              Upload
            </LoadingButton>
          </Stack>
        )}
      </Box>
    </Dialog>
  );
}
