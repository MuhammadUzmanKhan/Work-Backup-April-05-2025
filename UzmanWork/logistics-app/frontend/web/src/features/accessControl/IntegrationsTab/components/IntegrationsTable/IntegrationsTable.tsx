import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { IntegrationsTableRow } from "./components";
import { QueryObserverResult } from "react-query";
import { AccessControlIntegration } from "coram-common-utils";

export interface IntegrationsTableProps {
  integrations: AccessControlIntegration[];
  refetchIntegrations: () => Promise<
    QueryObserverResult<AccessControlIntegration[]>
  >;
}

export function IntegrationsTable({
  integrations,
  refetchIntegrations,
}: IntegrationsTableProps) {
  return (
    <TableContainer component={Paper} sx={{ height: "80vh" }}>
      <Table stickyHeader sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell>Integration</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {integrations.map((integration) => (
            <IntegrationsTableRow
              key={integration.vendor}
              integration={integration}
              refetchIntegrations={refetchIntegrations}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
