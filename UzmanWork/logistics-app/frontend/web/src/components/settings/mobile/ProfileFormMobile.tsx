import { useContext, useState } from "react";
import type { GetTokenSilentlyOptions, User } from "@auth0/auth0-react";
import { NotificationContext } from "contexts/notification_context";
import { MembersService } from "coram-common-utils";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  OutlinedInput,
} from "@mui/material";
import styled from "@emotion/styled";

interface ProfileFormMobileInterface {
  user: User | undefined;
  getAccessTokenSilently: (options: GetTokenSilentlyOptions) => void;
}

const FormField = styled(FormControl)(() => ({
  "&.MuiFormControl-root": {
    width: "100%",
    padding: "0.5rem 0",
  },
  input: {
    padding: "12px 15px",
  },
}));

export function ProfileFormMobile({
  user,
  getAccessTokenSilently,
}: ProfileFormMobileInterface) {
  const [name, setName] = useState(user?.name);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const { setNotificationData } = useContext(NotificationContext);

  async function handleSubmit() {
    if (!user || !user.sub) return;
    try {
      await MembersService.updateUserName({
        user_id: user.sub,
        user_name: name ?? "",
      });
    } catch (error) {
      setNotificationData({
        message: "Something went wrong. Please try again later!",
        severity: "error",
      });
      setName(user?.name);
    } finally {
      getAccessTokenSilently({ cacheMode: "off" });
      setSaveInProgress(false);
    }
  }

  return (
    <Box component="form" noValidate autoComplete="off">
      <FormField>
        <OutlinedInput
          value={name}
          onChange={(event) => {
            setName(event.target.value as string);
          }}
          placeholder="Enter Name"
        />
      </FormField>
      <Button
        size="medium"
        onClick={handleSubmit}
        disabled={name?.length == 0}
        variant="contained"
        fullWidth
      >
        {saveInProgress ? (
          <CircularProgress size={18} sx={{ color: "white" }} />
        ) : (
          "Save"
        )}
      </Button>
    </Box>
  );
}
