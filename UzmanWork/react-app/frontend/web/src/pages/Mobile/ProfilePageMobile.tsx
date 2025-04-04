import { useAuth0 } from "@auth0/auth0-react";
import { Box, Stack } from "@mui/material";
import { UserCardMobile } from "components/UserCardMobile";
import { ProfileFormMobile } from "components/settings/mobile/ProfileFormMobile";
import { UserAccountActionsList } from "components/settings/mobile/UserAccountActionsList";

export function ProfilePageMobile() {
  const { user, getAccessTokenSilently } = useAuth0();
  return (
    <Stack
      sx={{
        width: "100vw",
        p: 2,
      }}
    >
      <UserCardMobile />
      <ProfileFormMobile
        user={user}
        getAccessTokenSilently={getAccessTokenSilently}
      />

      <Box
        sx={{
          position: "fixed",
          bottom: "0",
          width: "100%",
        }}
      >
        <UserAccountActionsList />
      </Box>
    </Stack>
  );
}
