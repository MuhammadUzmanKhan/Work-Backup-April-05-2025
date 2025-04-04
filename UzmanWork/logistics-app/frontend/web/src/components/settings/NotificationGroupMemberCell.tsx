import {
  Button,
  FormControl,
  OutlinedInput,
  Stack,
  styled,
} from "@mui/material";
import { EmailTextField } from "components/EmailTextField";
import { PhoneNumberTextField } from "components/PhoneNumberTextField";
import {
  AddCircleOutlineOutlined as AddCircleOutlineOutlinedIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { EditMenu } from "../common/EditMenu";
import { isContactInfoValid } from "./utils";
import { NotificationGroupMember } from "coram-common-utils";

export interface ExtendedNotificationGroupMember
  extends NotificationGroupMember {
  isSaved: boolean;
}

const NotificationFormField = styled(FormControl)(() => ({
  input: {
    width: "16rem",
    padding: "0.4rem",
  },
}));

interface NotificationGroupMemberCellProps {
  groupMember: ExtendedNotificationGroupMember;
  onMemberCreate(): void;
  onMemberSave(member: ExtendedNotificationGroupMember): void;
  onMemberDelete: (memberId: number) => void;
}

export function NotificationGroupMemberCell({
  groupMember,
  onMemberCreate,
  onMemberSave,
  onMemberDelete,
}: NotificationGroupMemberCellProps) {
  const anchorEl = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(
    !isContactInfoValid(groupMember.phone_number, groupMember.email_address)
  );
  const [enableSave, setEnableSave] = useState(
    isContactInfoValid(groupMember.phone_number, groupMember.email_address)
  );
  const [localGroupMember, setLocalGroupMember] =
    useState<ExtendedNotificationGroupMember>(groupMember);

  useEffect(() => {
    setLocalGroupMember((prevState) => {
      return {
        ...prevState,
        user_name: groupMember.user_name,
        email_address: groupMember.email_address,
        phone_number: groupMember.phone_number,
      };
    });
  }, [
    groupMember.user_name,
    groupMember.email_address,
    groupMember.phone_number,
  ]);

  return (
    <Stack direction="row" gap={2} alignItems="flex-start">
      <NotificationFormField>
        <EmailTextField
          autoFocus
          margin="dense"
          id="name"
          placeholder="Enter Email Address"
          variant="outlined"
          disabled={!editMode}
          value={localGroupMember.email_address || ""}
          sx={{ margin: "0" }}
          onChange={(newEmail) => {
            setEditMode(true);
            setLocalGroupMember({
              ...localGroupMember,
              email_address: newEmail.target.value,
            });
            setEnableSave(
              isContactInfoValid(
                localGroupMember.phone_number,
                newEmail.target.value
              )
            );
          }}
        />
      </NotificationFormField>
      <NotificationFormField>
        <PhoneNumberTextField
          value={localGroupMember.phone_number || ""}
          disabled={!editMode}
          placeholder="Enter Mobile Number"
          forceCallingCode={true}
          onChange={(newPhoneNumber) => {
            setEditMode(true);
            setLocalGroupMember({
              ...localGroupMember,
              phone_number: newPhoneNumber,
            });
            setEnableSave(
              isContactInfoValid(newPhoneNumber, localGroupMember.email_address)
            );
          }}
          fullWidth={false}
          sx={{ maxWidth: "300px" }}
          size="medium"
        />
      </NotificationFormField>
      <NotificationFormField>
        <OutlinedInput
          value={localGroupMember.user_name || ""}
          disabled={!editMode}
          onChange={(ev) => {
            setEditMode(true);
            setLocalGroupMember({
              ...localGroupMember,
              user_name: ev.target.value,
            });
          }}
          placeholder="Enter Name"
        />
      </NotificationFormField>

      {editMode ? (
        <NotificationFormField>
          <Button
            variant="contained"
            color="secondary"
            disabled={!enableSave}
            sx={{
              p: "0.35rem 0",
              minWidth: "7rem",
              borderRadius: "0.2rem",
            }}
            onClick={() => {
              setEditMode(false);
              onMemberSave(localGroupMember);
            }}
          >
            Save
          </Button>
        </NotificationFormField>
      ) : (
        <>
          <NotificationFormField sx={{ py: "0.3rem" }}>
            <MoreVertIcon
              ref={anchorEl}
              onClick={() => setMenuOpen(true)}
              sx={{
                cursor: "pointer",
                color: "neutral.1000",
              }}
            />
          </NotificationFormField>
          <NotificationFormField sx={{ py: "0.3rem" }}>
            <AddCircleOutlineOutlinedIcon
              sx={{ cursor: "pointer", color: "neutral.1000" }}
              onClick={() => {
                onMemberCreate();
              }}
            />
          </NotificationFormField>
        </>
      )}
      <EditMenu
        anchorEl={anchorEl.current}
        open={menuOpen}
        editLabel="Edit"
        deleteLabel="Delete"
        sx={{ mt: 1, ml: 8 }}
        setMenuOpen={setMenuOpen}
        onClose={() => setMenuOpen(false)}
        onDelete={() => {
          onMemberDelete(groupMember.id);
          setMenuOpen(false);
        }}
        onEdit={() => {
          setEditMode(true);
          setMenuOpen(false);
        }}
      />
    </Stack>
  );
}
