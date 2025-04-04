import { Button, CircularProgress, Stack, Typography } from "@mui/material";
import { UserRole } from "coram-common-utils";
import { EmailTextField, emailIsInvalid } from "components/EmailTextField";
import { NestedSelector } from "components/selector/NestedSelector";
import { RoleSelector } from "./RoleSelector";
import { NotificationContext } from "contexts/notification_context";
import { useContext, useState } from "react";
import { MemberAddFn, useHandleNestedSelector } from "hooks/members";

const EmailTextFieldStyle = {
  flexGrow: 1,
  borderRadius: "4px",
  // Have lastpass ignore this field.
  autocomplete: "off",
  "& .MuiInputBase-adornedEnd": {
    paddingRight: "0px",
    height: "52px",
    borderRadius: "4px",
  },
  "& .MuiOutlinedInput-input": {
    color: "neutral.1000",
    fontWeight: "400",
    fontSize: "14px",
  },
};

const locationSelectorStyle = {
  minWidth: 160,
  display: "flex",
  justifyContent: "center",
  height: "1.5rem",
  paddingRight: "0.2rem",
  border: "0",
};

interface MemberAddProps {
  handleMemberAdd: MemberAddFn;
  isSubmitLoading: boolean;
}

export function MemberAdd({
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
    <Stack direction="row" alignItems="start" maxHeight="3.5rem" gap={2}>
      <EmailTextField
        value={emailInput}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          setEmailInput(event.target.value)
        }
        sx={{ ...EmailTextFieldStyle }}
        placeholder="Enter e-mail address"
        InputProps={{
          endAdornment: (
            <Stack direction="row" mr={1.5}>
              <RoleSelector
                initialRole={userRole}
                onRoleChange={setUserRole}
                sx={{
                  border: 0,
                  color: "common.black",
                }}
                selectorProps={{
                  fontWeight: "600",
                }}
              />
              {fetched && (
                <NestedSelector
                  items={availableCameraGroupItems}
                  groups={availableLocations}
                  selectionData={selectedLocationsData}
                  label={
                    userRole === UserRole.ADMIN
                      ? "All Cameras"
                      : "Camera Access"
                  }
                  displayDoneButton={true}
                  onChange={handleUpdateLocationGroup}
                  onClose={handleUpdateLocationGroup}
                  onClick={handleUpdateLocationGroup}
                  selectorProps={{
                    fontWeight: "600",
                  }}
                  disabled={userRole === UserRole.ADMIN}
                  sx={{ ...locationSelectorStyle, height: "2rem" }}
                />
              )}
            </Stack>
          ),
        }}
      />
      <Button
        color="secondary"
        sx={{
          width: "175px",
          height: "52px",
          borderRadius: "4px",
        }}
        disabled={emailIsInvalid(emailInput) || emailInput.length == 0}
        size="large"
        variant="contained"
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
        endIcon={
          isSubmitLoading && (
            <CircularProgress
              size={18}
              sx={{
                color: "white",
              }}
            />
          )
        }
      >
        <Typography variant="body1">Send Invite</Typography>
      </Button>
    </Stack>
  );
}
