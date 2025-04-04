import { CircularProgress, Stack, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useOnMount } from "hooks/lifetime";
import { PathNames } from "hooks/usePageNavigation";
import { SHOW_SET_API_KEY_DIALOG_QUERY_PARAM } from "features/accessControl";

export function AccessControlIntegrationAuthSuccessCbPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const provider = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get("provider") ?? "";
  }, [location.search]);

  useOnMount(() => {
    const redirectUrl =
      provider === "Brivo"
        ? `${PathNames.INTEGRATIONS}/settings?${SHOW_SET_API_KEY_DIALOG_QUERY_PARAM}`
        : PathNames.INTEGRATIONS;

    setTimeout(() => navigate(redirectUrl), 2500);
  });

  return (
    <Stack
      height="100vh"
      bgcolor="common.white"
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      <CircularProgress color="secondary" />
      <Typography variant="body1">
        Your {provider} Integration has been successfully created. You will be
        redirected back to the Integrations page.
      </Typography>
    </Stack>
  );
}
