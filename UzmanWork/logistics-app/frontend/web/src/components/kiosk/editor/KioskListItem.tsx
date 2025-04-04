import {
  Avatar,
  Chip,
  Link,
  ListItem,
  Tooltip,
  ListItemAvatar,
  ListItemText,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  RefreshOutlined as RefreshOutlinedIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { KioskIcon } from "icons/kiosk-icon";
import { useMemo, useState } from "react";
import {
  getKioskType,
  KioskDrawerMode,
  UpdateWallsForKioskParams,
} from "./utils";
import { KioskDrawer } from "./KioskDrawer";
import { KioskListItemMenu } from "./KioskListItemMenu";
import {
  Kiosk,
  Wall,
  UpdateKioskStatusRequest,
  UpdateWallsForKioskRequest,
  RenameKioskRequest,
  ShareKioskRequest,
  MountIf,
} from "coram-common-utils";
import { NameEdit } from "components/common/NameEdit";
import CopyToClipboardButton from "components/CopyToClipboardButton";
import { ShareKioskDialog } from "./ShareKioskDialog";
import { confirm } from "utils/confirm";

interface KioskListItemProps {
  kiosk: Kiosk;
  userWalls: Wall[];
  currentUserEmail: string;
  onUpdateKioskWalls: (request: UpdateWallsForKioskRequest) => Promise<void>;
  onUpdateKioskStatus: (request: UpdateKioskStatusRequest) => Promise<void>;
  onRemoveKiosk: (kiosk_id: number) => Promise<void>;
  onRegenerateKioskHash: (kiosk_id: number) => Promise<void>;
  onRenameKiosk: (request: RenameKioskRequest) => Promise<void>;
  onShareKiosk: (request: ShareKioskRequest) => Promise<void>;
}

export function KioskListItem({
  kiosk,
  userWalls,
  currentUserEmail,
  onUpdateKioskWalls,
  onUpdateKioskStatus,
  onRemoveKiosk,
  onRegenerateKioskHash,
  onRenameKiosk,
  onShareKiosk,
}: KioskListItemProps) {
  const [openDrawer, setOpenDrawer] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<
    null | (EventTarget & SVGSVGElement)
  >(null);
  const kioskPublicLink = `${import.meta.env.VITE_WEB_APP_URL}/k/${kiosk.hash}`;
  const [isEditingName, setIsEditingName] = useState(false);
  const [isHoveringName, setIsHoveringName] = useState(false);
  // Whether the share dialog is open.
  const [openShareDialog, setOpenShareDialog] = useState(false);
  const wallNames =
    kiosk.walls.map((wall) => wall.name).join(", ") || "No walls";
  const initialKiosk = useMemo(() => {
    return {
      walls: kiosk.walls,
      rotateFrequencyS: kiosk.rotate_frequency_s,
    };
  }, [kiosk]);

  return (
    <>
      <ListItem
        sx={{
          display: "flex",
          flexDirection: "row",
          gap: 2,
        }}
        secondaryAction={
          <Stack direction="row" alignItems="center">
            <Switch
              checked={kiosk.is_enabled}
              color="secondary"
              onChange={async (ev) => {
                await onUpdateKioskStatus({
                  kiosk_id: kiosk.id,
                  is_enabled: ev.target.checked,
                });
              }}
            />
            <MoreVertIcon
              sx={{
                cursor: "pointer",
              }}
              onClick={(ev) => setAnchorEl(ev.currentTarget)}
            />
          </Stack>
        }
      >
        <ListItemAvatar>
          <Avatar
            sx={{
              backgroundColor: "neutral.200",
              borderRadius: "0.4rem",
              width: "60px",
              height: "60px",
            }}
          >
            <KioskIcon color="action" width="24px" height="24px" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primaryTypographyProps={{ component: "div" }}
          primary={
            <Stack direction="row" gap={0.5}>
              {isEditingName ? (
                <NameEdit
                  prevName={kiosk.name}
                  setIsEditing={setIsEditingName}
                  onSubmit={async (name: string) => {
                    await onRenameKiosk({
                      kiosk_id: kiosk.id,
                      name: name,
                    });
                  }}
                  maxNameLength={20}
                  width="8rem"
                />
              ) : (
                <Stack
                  onMouseEnter={() => setIsHoveringName(true)}
                  onMouseLeave={() => setIsHoveringName(false)}
                  direction="row"
                  alignItems="flex-end"
                  gap={1}
                >
                  <Typography variant="body1">{kiosk.name}</Typography>
                  {isHoveringName && (
                    <EditIcon
                      fontSize="small"
                      color="primary"
                      sx={{ mb: "3px", cursor: "pointer" }}
                      onClick={() => setIsEditingName(true)}
                    />
                  )}
                </Stack>
              )}
              <Chip
                label={getKioskType(kiosk.walls.length)
                  .replace(/_/g, " ")
                  .toUpperCase()}
                size="small"
                style={{
                  background: "#83889E",
                  color: "#ffff",
                  fontSize: "0.625rem",
                  fontWeight: "bold",
                }}
              />
            </Stack>
          }
          secondaryTypographyProps={{ component: "div" }}
          secondary={
            <Stack direction="column">
              <Typography variant="body2">{`Walls: ${wallNames}`}</Typography>
              <Typography variant="body2">{`Owner: ${kiosk.creator_user_email}`}</Typography>
              <Stack direction="row" gap={1.4} alignItems="center">
                <Link
                  href={kioskPublicLink}
                  color="common.black"
                  fontWeight={400}
                  target="_blank"
                  fontSize="0.875rem"
                >
                  {kioskPublicLink}
                </Link>
                <Stack direction="row">
                  <CopyToClipboardButton
                    clipboardText={kioskPublicLink}
                    color="primary.main"
                  />
                  <Tooltip
                    followCursor
                    title={"Refresh kiosk url"}
                    placement="bottom-start"
                  >
                    <RefreshOutlinedIcon
                      color="primary"
                      fontSize="small"
                      sx={{
                        cursor: "pointer",
                      }}
                      onClick={async () => {
                        const isConfirmed = await confirm({
                          confirmText:
                            "This action will invalidate the previous url. Any page that is currently using the previous url will stop working.",
                          yesText: "Yes, refresh the url",
                          noText: "No, keep the current url",
                        });
                        if (!isConfirmed) {
                          return;
                        }
                        await onRegenerateKioskHash(kiosk.id);
                      }}
                    />
                  </Tooltip>
                </Stack>
              </Stack>
            </Stack>
          }
        />
      </ListItem>
      <KioskListItemMenu
        kioskId={kiosk.id}
        kioskOwnerEmail={kiosk.creator_user_email}
        currentUserEmail={currentUserEmail}
        setOpenDrawer={setOpenDrawer}
        onRemoveKiosk={onRemoveKiosk}
        onShareClick={() => setOpenShareDialog(true)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      />
      <MountIf condition={openShareDialog}>
        <ShareKioskDialog
          dialogOpen={openShareDialog}
          setDialogOpen={setOpenShareDialog}
          kioskId={kiosk.id}
          onShareKiosk={onShareKiosk}
        />
      </MountIf>
      <KioskDrawer
        open={openDrawer}
        setOpen={setOpenDrawer}
        initialKiosk={initialKiosk}
        userWalls={userWalls}
        drawerMode={KioskDrawerMode.Edit}
        onKioskSubmit={async (params: UpdateWallsForKioskParams) =>
          await onUpdateKioskWalls({
            kiosk_id: kiosk.id,
            wall_ids: params.walls.map((wall) => wall.id),
            rotate_frequency_s: params.rotateFrequencyS,
          })
        }
      />
    </>
  );
}
