import { useState, useRef } from "react";
import {
  Chip,
  Stack,
  Typography,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  EditOutlined as EditOutlinedIcon,
  ShareOutlined as ShareOutlinedIcon,
  HighlightOff as HighlightOffIcon,
  BorderColorOutlined as BorderColorOutlinedIcon,
} from "@mui/icons-material";
import ShareDialog from "components/ShareDialog";
import { matchApiException } from "utils/error_handling";
import { NameEdit } from "components/common/NameEdit";
import { MAX_WALL_NAME_LENGTH } from "./utils";

interface WallItemProps {
  wallName: string;
  onWallRename: (newName: string) => Promise<void>;
  onWallClick?: (setIsEditing: (newIsEditing: boolean) => void) => void;
  onWallEdit?: VoidFunction;
  onWallRemove?: () => Promise<void>;
  onWallShare?: (shareWithEmails: string[]) => Promise<void>;
  isSelected: boolean;
}

export function WallItem({
  wallName,
  onWallRename,
  onWallClick,
  onWallEdit,
  onWallRemove,
  onWallShare,
  isSelected,
}: WallItemProps) {
  // Whether the wall name is being edited
  const [isEditing, setIsEditing] = useState(false);
  // Whether the drop-down menu is open
  const [menuOpen, setMenuOpen] = useState(false);
  // Whether the share modal is open
  const [shareOpen, setShareOpen] = useState(false);
  const anchorEl = useRef<SVGSVGElement>(null);
  const theme = useTheme();

  function errorMessage(e: unknown) {
    const message = matchApiException(e, "A wall with this name already exists")
      ? "Wall is already shared with at least one of these users!"
      : "Failure sharing wall!";
    return message;
  }

  return (
    <>
      <Chip
        sx={{
          cursor: "pointer",
          "&.MuiChip-outlinedDefault": {
            borderColor: "neutral.200",
          },
        }}
        variant={isSelected && !isEditing ? "filled" : "outlined"}
        label={
          <Stack direction="row" alignItems="center" gap={1}>
            {isEditing ? (
              <NameEdit
                prevName={wallName}
                setIsEditing={setIsEditing}
                onSubmit={async (name: string) => {
                  try {
                    await onWallRename(name);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                maxNameLength={MAX_WALL_NAME_LENGTH}
              />
            ) : (
              <>
                <Typography
                  variant="body1"
                  onClick={() => onWallClick?.(setIsEditing)}
                  marginRight="0.5rem"
                >
                  {wallName}
                </Typography>
                <MoreVertIcon
                  ref={anchorEl}
                  onClick={() => setMenuOpen(true)}
                  sx={{ fontSize: "1rem" }}
                />
              </>
            )}
          </Stack>
        }
      />
      <Menu
        anchorEl={anchorEl.current}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <MenuItem
          onClick={() => {
            setIsEditing(true);
            setMenuOpen(false);
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.6}>
            <BorderColorOutlinedIcon
              fontSize="small"
              sx={{
                stroke: theme.palette.neutral?.[100],
              }}
            />
            <Typography variant="body2">Rename</Typography>
          </Stack>
        </MenuItem>
        {onWallEdit && (
          <MenuItem
            onClick={() => {
              onWallEdit();
              setMenuOpen(false);
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.6}>
              <EditOutlinedIcon
                fontSize="small"
                sx={{
                  stroke: theme.palette.neutral?.[100],
                }}
              />
              <Typography variant="body2">Edit</Typography>
            </Stack>
          </MenuItem>
        )}

        {onWallShare && (
          <MenuItem
            onClick={() => {
              setShareOpen(true);
              setMenuOpen(false);
            }}
          >
            <Stack direction="row" alignItems="center" gap={0.6}>
              <ShareOutlinedIcon
                fontSize="small"
                sx={{
                  color: theme.palette.neutral?.[700],
                }}
              />
              <Typography variant="body2">Share</Typography>
            </Stack>
          </MenuItem>
        )}

        {onWallRemove && (
          <MenuItem onClick={async () => onWallRemove()}>
            <Stack direction="row" alignItems="center" gap={0.6}>
              <HighlightOffIcon
                fontSize="small"
                sx={{
                  stroke: theme.palette.neutral?.[200],
                }}
              />
              <Typography variant="body2">Remove</Typography>
            </Stack>
          </MenuItem>
        )}
      </Menu>
      {onWallShare && (
        <ShareDialog
          shareOpen={shareOpen}
          setShareOpen={setShareOpen}
          onShare={async (emails: string[]) => {
            await onWallShare(emails);
          }}
          title={"Share Wall"}
          text={
            "Sharing a wall creates a copy for that user - their and your changes will not interfere."
          }
          successMessage={(emails: string[]) => {
            return "Successfully shared wall with " + emails.join(", ");
          }}
          errorMessage={errorMessage}
        />
      )}
    </>
  );
}
