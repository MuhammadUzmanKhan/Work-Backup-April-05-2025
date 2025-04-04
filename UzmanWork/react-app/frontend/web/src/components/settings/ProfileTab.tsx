import { useAuth0 } from "@auth0/auth0-react";
import styled from "@emotion/styled";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  FormControl,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import { MembersService } from "coram-common-utils";
import { useState } from "react";

const FormField = styled(FormControl)(() => ({
  "&.MuiFormControl-root": {
    width: "100%",
    padding: "0.5rem 0",
  },
  input: {
    padding: "12px 15px",
  },
}));

export function ProfileTab() {
  const { user, getAccessTokenSilently } = useAuth0();
  const [name, setName] = useState(user?.name);
  const [saveInProgress, setSaveInProgress] = useState(false);

  // TODO(nedyalko): With removing phone number this submit is no-op, but
  // keeping it to allow updating other fields in the future.
  async function handleSubmit() {
    if (!user || !user.sub || saveInProgress) return;
    try {
      setSaveInProgress(true);
      await MembersService.updateUserName({
        user_id: user.sub,
        user_name: name ?? "",
      });
    } catch (error) {
      console.error(error);
      setName(user?.name);
    } finally {
      getAccessTokenSilently({ cacheMode: "off" });
      setSaveInProgress(false);
    }
  }

  return (
    <Stack padding={3}>
      <Typography variant="h2" sx={{ fontWeight: "500" }}>
        Profile
      </Typography>
      <List
        sx={{
          width: "100%",
          bgcolor: "background.paper",
          py: "1rem",
        }}
      >
        <ListItem sx={{ px: 0 }}>
          <ListItemAvatar>
            <Avatar
              alt="user icon"
              src="/static/user.png"
              sx={{
                width: "64px",
                height: "64px",
              }}
            />
          </ListItemAvatar>
          <ListItemText
            sx={{ ml: "1.25rem" }}
            primary={user?.email}
            secondary={user?.role || "Member"}
          />
        </ListItem>
      </List>
      <Box
        component="form"
        sx={{ width: "25vw" }}
        noValidate
        autoComplete="off"
      >
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
          sx={{ mt: "0.5rem", width: "120px" }}
          size="large"
          onClick={handleSubmit}
          variant="contained"
        >
          {saveInProgress ? (
            <CircularProgress size={18} sx={{ color: "white" }} />
          ) : (
            <Typography variant="body1"> Save</Typography>
          )}
        </Button>
      </Box>
    </Stack>
  );
}
