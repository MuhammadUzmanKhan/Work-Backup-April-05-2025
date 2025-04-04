import { TableCell } from "@mui/material";
import {
  LicensePlateAlertProfile,
  LicensePlateAlertService,
  NotificationGroup,
} from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { useContext, useState } from "react";
import { NestedSelectionData } from "components/selector/GroupSelector";
import { NestedSelector } from "components/selector/NestedSelector";

interface LicensePlateOfInterestTableRowCellProps {
  alertProfile: LicensePlateAlertProfile;
  notificationGroups: Map<number, NotificationGroup>;
}

const EMPTY_GROUP_MEMBERS = new Map();

export function LicensePlateOfInterestTableRowCell({
  alertProfile,
  notificationGroups,
}: LicensePlateOfInterestTableRowCellProps) {
  const { setNotificationData } = useContext(NotificationContext);
  const [selectedNotificationGroup, setSelectedNotificationGroup] = useState<
    Map<number, NestedSelectionData>
  >(
    new Map(
      alertProfile.notification_groups.map((group) => [
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
      await LicensePlateAlertService.updateNotificationGroups(alertProfile.id, {
        notification_group_ids: Array.from(notificationsData.keys()),
      });
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
    <TableCell sx={{ minWidth: "150px" }} align="center">
      <NestedSelector
        groups={notificationGroups}
        items={EMPTY_GROUP_MEMBERS}
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
    </TableCell>
  );
}
