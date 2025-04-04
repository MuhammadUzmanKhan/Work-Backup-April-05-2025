import { MenuItem, Stack, Typography } from "@mui/material";
import { Key as KeyIcon } from "@mui/icons-material";
import { BrivoSetApiKeyDialog } from "./BrivoSetApiKeyDialog";
import { useEffect, useState } from "react";
import type { QueryObserverResult } from "react-query";
import { AccessControlIntegration } from "coram-common-utils";
import { useLocation, useNavigate } from "react-router-dom";
import { SHOW_SET_API_KEY_DIALOG_QUERY_PARAM } from "features/accessControl/consts";

export interface BrivoSetApiKeyMenuItemProps {
  onMenuClose: VoidFunction;
  refetchIntegrations: () => Promise<
    QueryObserverResult<AccessControlIntegration[]>
  >;
}

export function BrivoSetApiKeyMenuItem({
  onMenuClose,
  refetchIntegrations,
}: BrivoSetApiKeyMenuItemProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [brivoSetApiKeyDialogOpen, setBrivoSetApiKeyDialogOpen] =
    useState(false);

  useEffect(() => {
    // If the query param is present, open the dialog. It is used when the integration is created, and we ask the user
    // to set the API key as the final step of the integration. After we changed the state to open the dialog, we remove
    // the query param from the URL so that the dialog doesn't open again on page refresh.
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get(SHOW_SET_API_KEY_DIALOG_QUERY_PARAM) !== null) {
      setBrivoSetApiKeyDialogOpen(true);
      queryParams.delete(SHOW_SET_API_KEY_DIALOG_QUERY_PARAM);
      navigate(
        {
          pathname: location.pathname,
          search: queryParams.toString(),
        },
        { replace: true }
      );
    }
  }, [location, navigate]);

  async function handleBrivoSetApiKeyDialogClose() {
    setBrivoSetApiKeyDialogOpen(false);
    await refetchIntegrations();
  }

  return (
    <>
      <MenuItem
        onClick={() => {
          onMenuClose();
          setBrivoSetApiKeyDialogOpen(true);
        }}
      >
        <Stack
          direction="row"
          alignContent="center"
          alignItems="center"
          gap={1}
        >
          <KeyIcon fontSize="small" />
          <Typography variant="body2">Set API Key</Typography>
        </Stack>
      </MenuItem>
      <BrivoSetApiKeyDialog
        open={brivoSetApiKeyDialogOpen}
        onClose={handleBrivoSetApiKeyDialogClose}
      />
    </>
  );
}
