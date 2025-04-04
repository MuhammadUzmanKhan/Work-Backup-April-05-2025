import { CircularProgress, Stack, Typography } from "@mui/material";
import { CenteredStack } from "components/styled_components/CenteredStack";
import {
  useCamerasAdmin,
  useOrganisationsAdmin,
} from "features/administration/hooks";
import { SearchInput } from "components/devices/SearchInput";
import { CameraResponse } from "coram-common-utils";
import { useState } from "react";
import { sortData, useSortable } from "utils/sortable";
import { CamerasSortKeys } from "./types";
import { CameraSettingsDrawer, CamerasTable } from "./components";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";
import { StyledAutocomplete } from "components/styled_components/StyledAutocomplete";
import { filterCamerasByTenantAndSearchQuery } from "./utils";
import { ALL_TENANTS_FILTER_OPTION } from "./consts";

export function CamerasTab() {
  const { isLoading: isOrganisationsLoading, data: organisations } =
    useOrganisationsAdmin();

  const {
    isLoading: isCamerasLoading,
    data: cameras,
    refetch: refetchCameras,
  } = useCamerasAdmin();

  const [selectedTenant, setSelectedTenant] = useState(
    ALL_TENANTS_FILTER_OPTION
  );

  const [searchQuery, setSearchQuery] = useState("");

  const isDataLoading = isOrganisationsLoading || isCamerasLoading;

  const sortable = useSortable<CamerasSortKeys>("nvr_name", "desc");
  const sortedCameras = sortData<CameraResponse>(
    cameras,
    sortable.orderBy,
    sortable.order
  );
  const filteredCameras = filterCamerasByTenantAndSearchQuery(
    sortedCameras,
    selectedTenant,
    searchQuery
  );

  const [selectedCamera, setSelectedCamera] = useState<CameraResponse | null>(
    null
  );

  async function handleCloseCameraSettingsDrawer() {
    setSelectedCamera(null);
  }

  return isDataLoading ? (
    <CenteredStack>
      <CircularProgress size={20} color="secondary" />
    </CenteredStack>
  ) : cameras.length == 0 ? (
    <AbsolutelyCentered>
      <Typography variant="h2">You do not have any Cameras yet</Typography>
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
            {cameras.length} Cameras registered in Coram
          </Typography>
          <Stack direction="row" gap={2} height="2.5rem">
            <StyledAutocomplete
              onChange={(_, value) => setSelectedTenant(value)}
              value={selectedTenant}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={
                <Typography fontSize="13px">No Organisation found</Typography>
              }
              disableClearable
              options={[
                ALL_TENANTS_FILTER_OPTION,
                ...organisations.map((organistaion) => ({
                  label: organistaion.name,
                  id: organistaion.tenant,
                })),
              ]}
              sx={{ width: "12rem" }}
            />
            <SearchInput
              placeHolder="Start typing to search"
              value={searchQuery}
              onChange={setSearchQuery}
              sx={{ width: "25rem" }}
            />
          </Stack>
        </Stack>
        <CamerasTable
          isDataLoading={isDataLoading}
          cameras={filteredCameras}
          sortable={sortable}
          onCameraSettingsClick={setSelectedCamera}
        />
      </Stack>
      <CameraSettingsDrawer
        camera={selectedCamera}
        refetchCameras={refetchCameras}
        onClose={handleCloseCameraSettingsDrawer}
      />
    </>
  );
}
