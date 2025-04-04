import { Stack, styled, TableCell, TableRow, Typography } from "@mui/material";
import { AccessControlIntegration } from "coram-common-utils";
import { SUPPORTED_VENDORS } from "features/accessControl/consts";
import type { QueryObserverResult } from "react-query";
import { Alert, Circle } from "icons";
import { IntegrationActions } from "./components";

export interface IntegrationsTableRowProps {
  integration: AccessControlIntegration;
  refetchIntegrations: () => Promise<
    QueryObserverResult<AccessControlIntegration[]>
  >;
}

export function IntegrationsTableRow({
  integration,
  refetchIntegrations,
}: IntegrationsTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Stack
          direction="row"
          spacing={1}
          justifyContent="start"
          alignItems="center"
        >
          {SUPPORTED_VENDORS[integration.vendor]?.icon}
          <Stack>
            <Typography variant="body2">
              {SUPPORTED_VENDORS[integration.vendor]?.name}
            </Typography>
          </Stack>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack direction="row" justifyContent="space-between">
          {integration.is_active ? (
            <StatusText>
              <OnlineIcon /> Active
            </StatusText>
          ) : (
            <StatusText>
              <WarningIcon /> Not Active. API Key was not found.
            </StatusText>
          )}
          <IntegrationActions
            integration={integration}
            refetchIntegrations={refetchIntegrations}
          />
        </Stack>
      </TableCell>
    </TableRow>
  );
}

const StatusText = styled(Typography)({
  display: "flex",
  gap: "0.5rem",
  flexDirection: "row",
  alignItems: "center",
});

const OnlineIcon = styled(Circle)(({ theme }) => ({
  height: "16px",
  width: "16px",
  color: theme.palette.success.main,
}));

const WarningIcon = styled(Alert)(({ theme }) => ({
  height: "16px",
  width: "16px",
  color: theme.palette.warning.main,
}));
