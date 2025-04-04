import {
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { SortHeadCell } from "components/SortHeadCell";
import { OrganisationsSortKeys } from "../types";
import { NoResultFoundPlaceholder } from "components/common";
import { OrganisationTableRow } from "./OrganisationTableRow";
import { Sortable } from "utils/sortable";
import { CameraResponse, NVRResponse, Organization } from "coram-common-utils";

interface OrganisationsTableProps {
  isDataLoading: boolean;
  organisations: Organization[];
  nvrsByTenant: Map<string, NVRResponse[]>;
  camerasByTenant: Map<string, CameraResponse[]>;
  sortable: Sortable<OrganisationsSortKeys>;
  onOrganisationSettingsClick: (organization: Organization) => void;
}

export function OrganisationsTable({
  isDataLoading,
  organisations,
  nvrsByTenant,
  camerasByTenant,
  sortable,
  onOrganisationSettingsClick,
}: OrganisationsTableProps) {
  return (
    <TableContainer component={Paper} sx={{ height: "76vh" }}>
      <Table stickyHeader sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <SortHeadCell<OrganisationsSortKeys>
              sortKey="name"
              sortable={sortable}
            >
              Name
            </SortHeadCell>
            <SortHeadCell<OrganisationsSortKeys>
              sortKey="tenant"
              sortable={sortable}
            >
              Tenant
            </SortHeadCell>
            <TableCell>CVRs Total</TableCell>
            <TableCell>CVRs Online</TableCell>
            <TableCell>Cameras Totals</TableCell>
            <TableCell>Cameras Online</TableCell>
            <TableCell>Settings</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isDataLoading ? (
            <TableRow>
              <TableCell colSpan={4} align="center" sx={{ border: "none" }}>
                <Stack padding="28vh 0" alignItems="center">
                  <CircularProgress color="secondary" />
                </Stack>
              </TableCell>
            </TableRow>
          ) : organisations.length > 0 ? (
            organisations.map((organisation) => (
              <OrganisationTableRow
                key={organisation.id}
                organisation={organisation}
                nvrs={nvrsByTenant.get(organisation.tenant) ?? []}
                cameras={camerasByTenant.get(organisation.tenant) ?? []}
                onOrganisationSettingsClick={onOrganisationSettingsClick}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ border: "none" }}>
                <NoResultFoundPlaceholder
                  padding="26vh 0"
                  alignItems="center"
                  text="No Organisations found"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
