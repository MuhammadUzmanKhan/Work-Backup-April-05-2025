import { useAuth0 } from "@auth0/auth0-react";
import { Browser } from "@capacitor/browser";
import { Box, Button, Stack, styled } from "@mui/material";
import { grey } from "@mui/material/colors";
import {
  Apple as AppleIcon,
  Email as EmailIcon,
  Microsoft as MicrosoftIcon,
} from "@mui/icons-material";

import { Google as GoogleIcon } from "../icons/google";

const LoginButton = styled(Button)({
  fontSize: "18px",
  fontWeight: "500",
  borderRadius: "12px",
});

const HighlightedLoginButton = styled(LoginButton)({
  color: "black",
  backgroundColor: "white",
  borderColor: "white",
  "&:hover": {
    color: "black",
    backgroundColor: "white",
    borderColor: "white",
  },
});

const ConnectionLoginButton = styled(LoginButton)({
  color: "white",
  backgroundColor: grey[900],
  borderColor: grey[900],
  "&:hover": {
    color: "white",
    backgroundColor: grey[900],
    borderColor: grey[900],
  },
});

const EmailLoginButton = styled(LoginButton)({
  color: "white",
  backgroundColor: "transparent",
  borderColor: grey[800],
  "&:hover": {
    color: "white",
    backgroundColor: "transparent",
    borderColor: grey[800],
  },
});

export function MobileLoginPage() {
  const { loginWithRedirect } = useAuth0();

  function onClick(connection: string) {
    loginWithRedirect({
      authorizationParams: {
        connection: connection,
        prompt: "login",
      },
      appState: { returnTo: "/" },
      async openUrl(url: string) {
        await Browser.open({
          url,
          windowName: "_self",
        });
      },
    });
  }

  return (
    <>
      <Box
        sx={{
          backgroundColor: "white",
          height: "fill-available",
        }}
      />

      <Box
        position="absolute"
        top="35%"
        left="50%"
        sx={{
          transform: "translate(-50%, -50%)",
        }}
      >
        <img
          height="45px"
          src="/static/coram_ai_logo_negative.svg"
          style={{ maxWidth: "100%" }}
        />
      </Box>

      <Stack
        textAlign="center"
        bgcolor="black"
        width="100%"
        position="fixed"
        bottom="0"
        left="0"
        gap={1.5}
        px={3}
        pt={3}
        pb={3}
        sx={{
          borderRadius: "40px 40px 0 0",
        }}
      >
        <HighlightedLoginButton
          variant="outlined"
          startIcon={<GoogleIcon />}
          onClick={() => onClick("google-oauth2")}
        >
          Continue with Google
        </HighlightedLoginButton>
        <ConnectionLoginButton
          variant="outlined"
          startIcon={<AppleIcon />}
          onClick={() => onClick("apple")}
        >
          Continue with Apple
        </ConnectionLoginButton>
        <ConnectionLoginButton
          variant="outlined"
          startIcon={<MicrosoftIcon />}
          onClick={() => onClick("windowslive")}
        >
          Continue with Microsoft
        </ConnectionLoginButton>

        <EmailLoginButton
          variant="outlined"
          startIcon={<EmailIcon />}
          onClick={() => onClick("Username-Password-Authentication")}
        >
          Log in with email
        </EmailLoginButton>
      </Stack>
    </>
  );
}
