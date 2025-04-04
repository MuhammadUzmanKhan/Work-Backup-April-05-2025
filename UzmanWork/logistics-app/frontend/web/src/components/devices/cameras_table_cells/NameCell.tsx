import {
  CheckOutlined as CheckOutlinedIcon,
  CloseOutlined as CloseOutlinedIcon,
  Edit as EditIcon,
  Wifi as WifiIcon,
} from "@mui/icons-material";
import {
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CameraResponse,
  DevicesService,
  ThumbnailResponse,
} from "coram-common-utils";
import { ThumbnailViewer } from "./ThumbnailViewer";
import { useIsAdmin } from "components/layout/RoleGuards";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Fade } from "components/Fade";
import { WifiOffIcon } from "icons/wifi-off-icon";
import { useIsMobile } from "components/layout/MobileOnly";
import { wrapTextStyle } from "components/devices/utils";
import { mapVendor } from "utils/camera_vendors";
import { preventEventBubbling } from "utils/dom_event_handling";

interface NameCellProps {
  stream: CameraResponse;
  refetch: () => void;
  thumbnail: ThumbnailResponse | undefined;
  showFullInfo: boolean;
  thumbnailHeight?: number;
  thumbnailWidth?: number;
  showOnlineStatus?: boolean;
}

export function NameCell({
  stream,
  refetch,
  thumbnail,
  showFullInfo,
  thumbnailHeight,
  thumbnailWidth,
  showOnlineStatus,
}: NameCellProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraName, setCameraName] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [isHoveringName, setIsHoveringName] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleNameChange = async () => {
    setLoading(true);
    try {
      await DevicesService.renameCamera(stream.camera.id, cameraName);
      refetch();
      setEditMode(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onCancelEdit = () => {
    setCameraName("");
    setEditMode(false);
    setIsHoveringName(false);
  };

  const onEditMode = () => {
    setCameraName(stream.camera.name);
    setEditMode(true);
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={2}
      onClick={() => navigate(`/timeline/${stream.camera.id}`)}
    >
      {showFullInfo && (
        <ThumbnailViewer
          macAddress={stream.camera.mac_address}
          cameraIsOnline={stream.camera.is_online}
          thumbnail={thumbnail}
          height={thumbnailHeight}
          width={thumbnailWidth}
        />
      )}

      <Stack direction="column" alignItems="flex-start">
        <Stack direction="row" alignItems="center">
          <Stack
            flexDirection="row"
            alignItems="center"
            borderBottom={editMode ? "2px solid" : "none"}
            borderColor="primary.main"
            onMouseEnter={() => setIsHoveringName(isAdmin)}
            onMouseLeave={() => setIsHoveringName(false)}
          >
            {!editMode ? (
              <>
                <Typography
                  sx={isMobile ? { ...wrapTextStyle } : {}}
                  variant="body1"
                  textAlign="start"
                >
                  {stream.camera.name}
                </Typography>
                <Fade in={isHoveringName}>
                  <Tooltip title="Edit camera name" placement="bottom">
                    <IconButton
                      onClick={(ev) => {
                        preventEventBubbling(ev);
                        onEditMode();
                      }}
                      sx={{ p: 0, ml: 1 }}
                    >
                      <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                </Fade>
              </>
            ) : (
              <Stack
                direction="row"
                alignItems="center"
                gap={0.5}
                onClick={preventEventBubbling}
              >
                <TextField
                  autoFocus
                  margin="dense"
                  required
                  value={cameraName}
                  onChange={(event) => setCameraName(event.target.value)}
                  variant="standard"
                  type="text"
                  sx={{
                    m: 0,
                    input: { color: "neutral.400" },
                    borderBottom: "none",
                    maxWidth: "120px",
                  }}
                  InputProps={{
                    disableUnderline: true,
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key !== "Enter") {
                      return;
                    }
                    handleNameChange();
                  }}
                  onBlur={(ev) => {
                    if (ev.target.value !== stream.camera.name) {
                      return handleNameChange();
                    }
                    onCancelEdit();
                  }}
                />
                <IconButton sx={{ p: 0 }} onClick={onCancelEdit}>
                  <CloseOutlinedIcon fontSize="small" color="disabled" />
                </IconButton>
                {!loading ? (
                  <IconButton sx={{ p: 0 }} onClick={handleNameChange}>
                    <CheckOutlinedIcon fontSize="small" color="secondary" />
                  </IconButton>
                ) : (
                  <CircularProgress size={18} />
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
        {showFullInfo && (
          <Stack direction="row" gap={1}>
            <Typography
              variant="body2"
              color="textSecondary"
              textAlign="start"
              sx={isMobile ? { ...wrapTextStyle, width: "56px" } : {}}
            >
              {mapVendor(stream.camera.vendor)}
            </Typography>
            {showOnlineStatus &&
              (stream.camera.is_online ? (
                <WifiIcon fontSize="small" color="success" />
              ) : (
                <WifiOffIcon fontSize="small" color="error" />
              ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
