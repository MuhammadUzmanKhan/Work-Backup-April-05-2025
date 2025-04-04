import { Button, MenuList, Popover, Typography } from "@mui/material";
import { KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import { useRef, useState } from "react";
import { BrivoIcon } from "icons/brivo-icon";
import { handleBrivoAuthRedirect } from "utils/brivo_auth";
import {
  AccessControlIntegration,
  useOrganizationContext,
  MountIf,
} from "coram-common-utils";
import { AvigilonAltaIcon } from "icons/avigilon-alta-icon";
import {
  ConnectAltaAccountDialog,
  CreateIntegrationMenuItem,
} from "./components";
import { QueryObserverResult } from "react-query";

export interface CreateIntegrationButtonProps {
  refetchIntegrations: () => Promise<
    QueryObserverResult<AccessControlIntegration[]>
  >;
}

export function CreateIntegrationButton({
  refetchIntegrations,
}: CreateIntegrationButtonProps) {
  const { organization } = useOrganizationContext();

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const [avigilonAltaAccountDialogOpen, setAvigilonAltaAccountDialogOpen] =
    useState(false);

  async function handleCloseConnectAltaAccountDialog() {
    setAvigilonAltaAccountDialogOpen(false);
    await refetchIntegrations();
  }

  return (
    <>
      <Button
        ref={anchorRef}
        variant="contained"
        color="secondary"
        sx={{
          borderRadius: "0.3rem",
          gap: "0.5rem",
        }}
        onClick={() => setOpen(!open)}
      >
        <Typography variant="body2">Create an Integration</Typography>
        <KeyboardArrowDownIcon />
        <Popover
          open={open}
          anchorEl={anchorRef.current}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: -10,
            horizontal: "center",
          }}
          PaperProps={{ sx: { minWidth: "320px" } }}
        >
          <MenuList sx={{ p: 1 }}>
            <CreateIntegrationMenuItem
              onClick={() => handleBrivoAuthRedirect(organization.tenant)}
            >
              <BrivoIcon />
              Integrate Brivo
            </CreateIntegrationMenuItem>
            <CreateIntegrationMenuItem
              onClick={() => setAvigilonAltaAccountDialogOpen(true)}
            >
              <AvigilonAltaIcon />
              Integrate Avigilon Alta
            </CreateIntegrationMenuItem>
          </MenuList>
        </Popover>
      </Button>
      <MountIf condition={avigilonAltaAccountDialogOpen}>
        <ConnectAltaAccountDialog
          open={avigilonAltaAccountDialogOpen}
          onClose={handleCloseConnectAltaAccountDialog}
        />
      </MountIf>
    </>
  );
}
