import {
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { NestedSelector } from "components/selector/NestedSelector";
import { UserRole } from "coram-common-utils";
import { RoleSelector } from "../RoleSelector";
import { emailIsInvalid } from "components/EmailTextField";
import { NotificationContext } from "contexts/notification_context";
import { useContext, useState } from "react";
import { MemberAddFn, useHandleNestedSelector } from "hooks/members";

const locationSelectorStyle = {
  color: "neutral.1000",
  height: "1.5rem",
  border: "0px",
};

interface MemberAddProps {
  handleMemberAdd: MemberAddFn;
  isSubmitLoading: boolean;
}

export function MemberAddMobile({
  handleMemberAdd,
  isSubmitLoading,
}: MemberAddProps) {
  const { setNotificationData } = useContext(NotificationContext);
  const [emailInput, setEmailInput] = useState("");
  const [userRole, setUserRole] = useState(UserRole.REGULAR);

  const {
    selectedLocationsData,
    availableLocations,
    availableCameraGroupItems,
    fetched,
    handleUpdateLocationGroup,
  } = useHandleNestedSelector();

  return (
    <Stack gap={1.5}>
      <Typography variant="body1">Add Members</Typography>
      <Stack border="1px solid #ccc" borderRadius="8px" p={1}>
        <TextField
          value={emailInput}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setEmailInput(event.target.value)
          }
          placeholder="Enter email address"
          fullWidth
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              border: "0",
              outline: "none",
              boxShadow: "none",
            },
          }}
        />
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <RoleSelector
            initialRole={userRole}
            onRoleChange={setUserRole}
            sx={{
              color: "neutral.1000",
              border: "0px",
            }}
            selectorProps={{
              fontWeight: "600",
              fontSize: "14px",
            }}
          />
          {fetched && (
            <NestedSelector
              items={availableCameraGroupItems}
              groups={availableLocations}
              selectionData={selectedLocationsData}
              label={userRole === UserRole.ADMIN ? "All Cameras" : "Access"}
              displayDoneButton={true}
              onChange={handleUpdateLocationGroup}
              onClose={handleUpdateLocationGroup}
              onClick={handleUpdateLocationGroup}
              selectorProps={{
                fontWeight: "600",
              }}
              disabled={userRole === UserRole.ADMIN}
              sx={{ ...locationSelectorStyle }}
            />
          )}
          <Button
            sx={{
              borderRadius: "4px",
              py: "0.5rem",
            }}
            disabled={emailIsInvalid(emailInput) || emailInput.length === 0}
            size="small"
            variant="contained"
            color="secondary"
            onClick={() =>
              handleMemberAdd(
                emailInput,
                userRole,
                selectedLocationsData,
                availableLocations,
                (message: string) => {
                  setNotificationData({ message, severity: "error" });
                },
                (message: string) => {
                  setNotificationData({ message, severity: "success" });
                  setEmailInput("");
                }
              )
            }
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              gap={1}
            >
              {isSubmitLoading && (
                <CircularProgress
                  color="secondary"
                  size={18}
                  sx={{ color: "white" }}
                />
              )}
              Send Invite
            </Stack>
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
