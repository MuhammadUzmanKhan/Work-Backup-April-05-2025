import { Box, Stack, Typography, useTheme } from "@mui/material";
import { FaceUploadPlaceholder } from "features/faceUploader/components/face-upload-placeholder";
import { useContext, useRef, useState } from "react";
import { isDefined } from "utils/types";
import { MAX_FACE_FILE_SIZE_MB } from "../constants";
import { NotificationContext } from "contexts/notification_context";
import { MountIf } from "coram-common-utils";

interface UploadBoxProps {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
}

export function UploadBox({ file, setFile }: UploadBoxProps) {
  const theme = useTheme();
  const { setNotificationData } = useContext(NotificationContext);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);
  const draggedBackgroundColor = `${theme.palette.secondary.main}AA`;

  function processFile(file: File) {
    if (file.size > MAX_FACE_FILE_SIZE_MB * 1024 * 1024) {
      const fileSizeMb = Math.round(file.size / 1024 / 1024);
      setNotificationData({
        message: `File size (${fileSizeMb}MB) is too large. Max file size is ${MAX_FACE_FILE_SIZE_MB}MB`,
        severity: "error",
      });
    }
    setFile(file);
  }

  async function dropHandler(ev: React.DragEvent<HTMLDivElement>) {
    // Prevent file from being opened
    ev.preventDefault();
    const files = [...ev.dataTransfer.files];
    if (files.length === 0) {
      return;
    }
    processFile(files[0]);
  }

  return (
    <Box
      border="1px dashed"
      borderColor={isDraggingOver ? theme.palette.secondary.main : "grey"}
      borderRadius="4px"
      sx={{
        transition: "background-color 500ms ease-out",
        backgroundColor: isDraggingOver ? draggedBackgroundColor : "#F0F3FB",
      }}
      mt={2}
      padding={4}
      onDrop={(ev) => {
        dropHandler(ev);
        setIsDraggingOver(false);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
      }}
    >
      <MountIf condition={!isDefined(file)}>
        <Stack justifyContent="center" alignItems="center" gap={4}>
          <FaceUploadPlaceholder sx={{ fontSize: 60 }} />
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.primary.main,
              userSelect: "none",
              cursor: "pointer",
            }}
            onClick={() => hiddenFileInputRef.current?.click()}
          >
            <span
              style={{ color: "black", cursor: "default" }}
              onClick={(ev) => ev.stopPropagation()}
            >
              Drag and drop or{" "}
            </span>
            choose a photo
            <span
              style={{ color: "black", cursor: "default" }}
              onClick={(ev) => ev.stopPropagation()}
            >
              {" "}
              to upload
            </span>
          </Typography>

          <input
            type="file"
            accept="image/png, image/jpeg"
            ref={hiddenFileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) {
                processFile(e.target.files[0]);
              }
            }}
          />
        </Stack>
      </MountIf>

      {file && (
        <Stack justifyContent="center" alignItems="center">
          <img
            src={URL.createObjectURL(file)}
            alt="face"
            style={{
              maxWidth: "100%",
              maxHeight: "170px",
            }}
          />
        </Stack>
      )}
    </Box>
  );
}
