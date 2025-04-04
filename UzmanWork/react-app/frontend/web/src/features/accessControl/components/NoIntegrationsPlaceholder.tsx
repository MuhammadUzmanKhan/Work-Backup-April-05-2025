import { Button, Typography } from "@mui/material";
import { CenteredStack } from "components/styled_components/CenteredStack";
import { Switch as SwitchIcon } from "icons/switch";
import { QueryObserverResult } from "react-query";
import { AccessControlIntegration } from "coram-common-utils";
import { useLocation, useNavigate } from "react-router-dom";
import { PathNames } from "hooks/usePageNavigation";
import { CreateIntegrationButton } from "./CreateIntegrationButton";

export interface NoIntegratedSensorsPlaceholderProps {
  refetchIntegrations: () => Promise<
    QueryObserverResult<AccessControlIntegration[]>
  >;
}

export function NoIntegrationsPlaceholder({
  refetchIntegrations,
}: NoIntegratedSensorsPlaceholderProps) {
  const location = useLocation();

  const isIntegrationSettings = location.pathname.startsWith(
    PathNames.INTEGRATIONS_SETTINGS
  );

  const navigate = useNavigate();

  return (
    <CenteredStack gap={2}>
      <SwitchIcon />
      <Typography variant="h2">You do not have any Integrations yet</Typography>
      {isIntegrationSettings ? (
        <CreateIntegrationButton refetchIntegrations={refetchIntegrations} />
      ) : (
        <Button
          variant="contained"
          color="secondary"
          sx={{
            borderRadius: "0.3rem",
            gap: "0.5rem",
          }}
          onClick={() => navigate(PathNames.INTEGRATIONS_SETTINGS)}
        >
          Open Settings to create an Integration
        </Button>
      )}
    </CenteredStack>
  );
}
