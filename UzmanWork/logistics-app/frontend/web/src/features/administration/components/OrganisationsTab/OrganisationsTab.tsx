import { CircularProgress, Stack, Typography } from "@mui/material";
import { CenteredStack } from "components/styled_components/CenteredStack";
import {
  useCamerasAdmin,
  useNVRsAdmin,
  useOrganisationsAdmin,
} from "features/administration/hooks";
import { SearchInput } from "components/devices/SearchInput";
import {
  CameraResponse,
  NVRResponse,
  type Organization,
} from "coram-common-utils";
import { useMemo, useState } from "react";
import { sortData, useSortable } from "utils/sortable";
import { OrganisationsSortKeys } from "./types";
import { OrganisationSettingsDrawer, OrganisationsTable } from "./components";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";

export function OrganisationsTab() {
  const { isLoading: isOrganisationsLoading, data: organisations } =
    useOrganisationsAdmin();

  const { isLoading: isNVRsLoading, data: nvrs } = useNVRsAdmin();
  const nvrByTenant = useMemo(
    () =>
      nvrs.reduce((acc, nvr) => {
        const tenant = nvr.org_tenant;
        const existingNVRs = acc.get(tenant) ?? [];
        acc.set(tenant, [...existingNVRs, nvr]);
        return acc;
      }, new Map<string, NVRResponse[]>()),
    [nvrs]
  );

  const { isLoading: isCamerasLoading, data: cameras } = useCamerasAdmin();
  const cameraByTenant = useMemo(
    () =>
      cameras.reduce((acc, camera) => {
        const tenant = camera.camera.tenant;
        const existingCameras = acc.get(tenant) ?? [];
        acc.set(tenant, [...existingCameras, camera]);
        return acc;
      }, new Map<string, CameraResponse[]>()),
    [cameras]
  );

  const [searchQuery, setSearchQuery] = useState("");

  const isDataLoading =
    isOrganisationsLoading || isNVRsLoading || isCamerasLoading;

  const sortable = useSortable<OrganisationsSortKeys>("name", "desc");
  const sortedOrganisations = sortData<Organization>(
    organisations,
    sortable.orderBy,
    sortable.order
  );

  const filteredOrganisations = sortedOrganisations.filter(
    (org) =>
      searchQuery.length === 0 ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.tenant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [selectedOrganisation, setSelectedOrganisation] =
    useState<Organization | null>(null);

  async function handleCloseOrganisationsSettingsDrawer() {
    setSelectedOrganisation(null);
  }

  return isDataLoading ? (
    <CenteredStack>
      <CircularProgress size={20} color="secondary" />
    </CenteredStack>
  ) : organisations.length == 0 ? (
    <AbsolutelyCentered>
      <Typography variant="h2">No Organisations in the system</Typography>
    </AbsolutelyCentered>
  ) : (
    <>
      <Stack gap={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h3">
            {organisations.length} Organisations registered
          </Typography>
          <SearchInput
            placeHolder="Search by Name/Tenant"
            value={searchQuery}
            onChange={setSearchQuery}
            sx={{
              width: "20rem",
            }}
          />
        </Stack>
        <OrganisationsTable
          isDataLoading={isDataLoading}
          organisations={filteredOrganisations}
          nvrsByTenant={nvrByTenant}
          camerasByTenant={cameraByTenant}
          sortable={sortable}
          onOrganisationSettingsClick={setSelectedOrganisation}
        />
      </Stack>
      <OrganisationSettingsDrawer
        organisation={selectedOrganisation}
        onClose={handleCloseOrganisationsSettingsDrawer}
      />
    </>
  );
}
