import { Button, Stack, Typography } from "@mui/material";
import { MembersService } from "coram-common-utils";
import { useLogout } from "hooks/logout";
import { confirm } from "utils/confirm";

export function ForbiddenPage() {
  const { logoutHandler } = useLogout();

  return (
    <Stack justifyContent="center" alignItems="center" minHeight="80vh" gap={5}>
      <Stack gap={1} textAlign="center">
        <Typography variant="h3">
          Your account is not associated with any organization.
        </Typography>
        <Typography variant="body1">
          If you think this is an error, please contact support@coram.ai
        </Typography>
      </Stack>
      <Button variant="contained" onClick={async () => await logoutHandler()}>
        Log out
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={async () => {
          const isConfirmed = await confirm({
            confirmText: "This action will permanently delete your account.",
            yesText: "Yes, delete my account",
            noText: "No, keep my account",
          });
          if (!isConfirmed) {
            return;
          }
          await MembersService.permanentlyDeleteOwnUser();
          await logoutHandler();
        }}
      >
        Delete Account
      </Button>
    </Stack>
  );
}
