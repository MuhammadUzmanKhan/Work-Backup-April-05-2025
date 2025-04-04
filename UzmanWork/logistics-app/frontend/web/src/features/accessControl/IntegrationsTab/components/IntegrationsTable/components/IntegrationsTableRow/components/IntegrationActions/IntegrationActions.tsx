import { IconButton, Menu } from "@mui/material";
import { MoreVert as MoreVertIcon } from "@mui/icons-material";
import { useRef, useState } from "react";
import {
  AccessControlIntegration,
  AccessControlService,
  AccessPointVendor,
} from "coram-common-utils";
import type { QueryObserverResult } from "react-query";
import {
  BrivoSetApiKeyMenuItem,
  RemoveIntegrationMenuItem,
} from "./components";

interface IntegrationActionsProps {
  integration: AccessControlIntegration;
  refetchIntegrations: () => Promise<
    QueryObserverResult<AccessControlIntegration[]>
  >;
}

export function IntegrationActions({
  integration,
  refetchIntegrations,
}: IntegrationActionsProps) {
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  function handleCloseMenu() {
    setOpen(false);
  }

  return (
    <>
      <IconButton
        onClick={() => setOpen((prevState) => !prevState)}
        ref={anchorRef}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        keepMounted
      >
        {integration.vendor === AccessPointVendor.BRIVO && (
          <BrivoSetApiKeyMenuItem
            onMenuClose={handleCloseMenu}
            refetchIntegrations={refetchIntegrations}
          />
        )}
        <RemoveIntegrationMenuItem
          onDelete={() =>
            AccessControlService.deleteIntegrations(integration.vendor)
          }
          onMenuClose={handleCloseMenu}
          refetchIntegrations={refetchIntegrations}
        />
      </Menu>
    </>
  );
}
