import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAccessControlIntegrations } from "features/accessControl/hooks";
import { CenteredStack } from "components/styled_components/CenteredStack";
import {
  CreateIntegrationButton,
  NoIntegrationsPlaceholder,
} from "../components";
import { IntegrationsTable } from "./components";

export function IntegrationsTab() {
  const {
    isLoading: isLoadingIntegrations,
    data: integrations,
    refetch: refetchIntegrations,
  } = useAccessControlIntegrations();

  return isLoadingIntegrations ? (
    <CenteredStack>
      <CircularProgress size={20} color="secondary" />
    </CenteredStack>
  ) : integrations.length == 0 ? (
    <NoIntegrationsPlaceholder refetchIntegrations={refetchIntegrations} />
  ) : (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body1">
          {integrations.length} Integrations
        </Typography>
        <CreateIntegrationButton refetchIntegrations={refetchIntegrations} />
      </Stack>
      <IntegrationsTable
        integrations={integrations}
        refetchIntegrations={refetchIntegrations}
      />
    </>
  );
}
