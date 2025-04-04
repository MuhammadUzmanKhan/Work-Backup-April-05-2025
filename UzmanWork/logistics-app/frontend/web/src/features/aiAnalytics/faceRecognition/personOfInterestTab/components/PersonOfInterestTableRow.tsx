import {
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import { DateTime } from "luxon";
import {
  CameraResponse,
  FaceAlertResponse,
  FaceAlertService,
  NotificationGroup,
} from "coram-common-utils";
import { NestedSelector } from "components/selector/NestedSelector";
import { NestedSelectionData } from "components/selector/GroupSelector";
import { useContext, useRef, useState } from "react";
import { NotificationContext } from "contexts/notification_context";
import { StyledSelect } from "components/styled_components/StyledSelect";
import { DeleteMenu } from "components/common/DeleteMenu";
import { FaceRenderer } from "../../components/FaceRenderer";
import { NotificationInfo } from "components/analytics/NotificationInfo";

interface PersonOfInterestTableRowProps {
  faceAlert: FaceAlertResponse;
  camera?: CameraResponse;
  notificationGroups: Map<number, NotificationGroup>;
  handleFaceAlertProfileDelete: (profileId: number) => void;
  onFaceClick: (faceId: number | null) => void;
}

export function PersonOfInterestTableRow({
  faceAlert,
  camera,
  notificationGroups,
  handleFaceAlertProfileDelete,
  onFaceClick,
}: PersonOfInterestTableRowProps) {
  const { setNotificationData } = useContext(NotificationContext);
  const anchorEl = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedNotificationGroup, setSelectedNotificationGroup] = useState<
    Map<number, NestedSelectionData>
  >(
    new Map(
      faceAlert.notification_groups.map((group) => [
        group.id,
        { isGroupSelected: true, selectedItemIds: [] },
      ])
    )
  );
  const [prevSelectedNotificationGroup, setPrevSelectedNotificationGroup] =
    useState<Map<number, NestedSelectionData>>(selectedNotificationGroup);

  async function handleNotificationSelectionSubmit(
    notificationsData: Map<number, NestedSelectionData>
  ) {
    try {
      await FaceAlertService.updateNotificationGroups(
        faceAlert.face_profile_id,
        {
          notification_group_ids: Array.from(notificationsData.keys()),
        }
      );
    } catch (e) {
      // If the update fails, revert to the previous state.
      setSelectedNotificationGroup(prevSelectedNotificationGroup);

      setNotificationData({
        message: "Failed to add notification group member",
        severity: "error",
      });
      console.error(e);
    }
  }

  return (
    <TableRow
      key={faceAlert.face_profile_id}
      sx={{
        "&:last-child td, &:last-child th": { borderBottom: 0 },
      }}
    >
      <TableCell sx={{ minWidth: "150px" }}>
        <Stack direction="row" alignItems="center" gap={3}>
          {faceAlert.face_profile_s3_signed_url !== undefined && (
            <FaceRenderer
              key={faceAlert.face_profile_id}
              face={{
                id: faceAlert.face_profile_id,
                s3_signed_url: faceAlert.face_profile_s3_signed_url,
              }}
              onClick={() => {
                onFaceClick(faceAlert.face_profile_id);
              }}
              width={50}
              height={60}
            />
          )}
          <Typography variant="body2">{faceAlert.description}</Typography>
          <MoreVertIcon
            ref={anchorEl}
            onClick={() => {
              setMenuOpen(true);
            }}
            sx={{ fontSize: "1.2rem", marginLeft: "auto" }}
          />
          <DeleteMenu
            anchorEl={anchorEl.current}
            open={menuOpen}
            deleteLabel="Remove from Person of Interest"
            sx={{ mt: 1, ml: 30 }}
            setMenuOpen={setMenuOpen}
            onClose={() => setMenuOpen(false)}
            onDelete={() => {
              handleFaceAlertProfileDelete(faceAlert.face_profile_id);
            }}
          />
        </Stack>
      </TableCell>
      <TableCell sx={{ minWidth: "150px" }}>
        <Typography variant="body2">
          {DateTime.fromISO(
            faceAlert.unique_face_occurrence.occurrence_time
          ).toLocaleString(DateTime.DATETIME_FULL)}
        </Typography>
      </TableCell>
      <TableCell sx={{ minWidth: "150px" }}>
        <Typography variant="body2">{camera?.location || ""}</Typography>
      </TableCell>
      <TableCell sx={{ minWidth: "150px" }}>
        <Typography variant="body2">{camera?.camera.name || ""}</Typography>
      </TableCell>
      <TableCell sx={{ minWidth: "150px" }} align="center">
        {notificationGroups.size ? (
          <NestedSelector
            groups={notificationGroups}
            items={new Map()}
            selectionData={selectedNotificationGroup}
            label={"Notification Group"}
            onChange={(selectionData) => {
              setSelectedNotificationGroup(selectionData);
            }}
            onOpen={(selectionData) => {
              setPrevSelectedNotificationGroup(selectionData);
            }}
            onClose={handleNotificationSelectionSubmit}
            onClick={() => null}
            selectorProps={{
              fontSize: "14px",
            }}
            disabled={false}
            sx={{
              display: "flex",
              minWidth: "200px",
              justifyContent: "center",
              height: "1.5rem",
              border: "1px solid #E0E0E0",
            }}
          />
        ) : (
          <StyledSelect
            value={-1}
            IconComponent={(props) => <KeyboardArrowDownIcon {...props} />}
            fullWidth
            displayEmpty
            sx={{ p: 0 }}
            MenuProps={{
              sx: { marginTop: "4px" },
            }}
          >
            <MenuItem value={-1} sx={{ display: "none" }}>
              Notification Group
            </MenuItem>
            <MenuItem>
              <NotificationInfo />
            </MenuItem>
          </StyledSelect>
        )}
      </TableCell>
    </TableRow>
  );
}
