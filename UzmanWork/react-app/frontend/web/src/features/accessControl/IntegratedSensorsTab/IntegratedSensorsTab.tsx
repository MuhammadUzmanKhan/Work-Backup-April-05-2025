import { CircularProgress, Typography } from "@mui/material";
import { NoIntegrationsPlaceholder } from "../components";
import {
  useAccessControlIntegrations,
  useAccessControlPoints,
} from "features/accessControl/hooks";
import { CenteredStack } from "components/styled_components/CenteredStack";
import { IntegratedSensorsTable } from "./components";

export function IntegratedSensorsTab() {
  const {
    isLoading: isLoadingIntegrations,
    data: integrations,
    refetch: refetchIntegrations,
  } = useAccessControlIntegrations();

  const {
    isLoading: isLoadingAccessControlPoints,
    data: accessPoints,
    refetch: refetchAccessPoints,
  } = useAccessControlPoints();

  const isLoading = isLoadingIntegrations || isLoadingAccessControlPoints;

  return isLoading ? (
    <CenteredStack>
      <CircularProgress size={20} color="secondary" />
    </CenteredStack>
  ) : integrations.length == 0 ? (
    <NoIntegrationsPlaceholder refetchIntegrations={refetchIntegrations} />
  ) : (
    <>
      <Typography variant="body1" py="10px">
        {accessPoints.length} Sensors Integrated
      </Typography>
      <IntegratedSensorsTable
        accessPoints={accessPoints}
        refetchAccessPoints={refetchAccessPoints}
      />
    </>
  );
}
