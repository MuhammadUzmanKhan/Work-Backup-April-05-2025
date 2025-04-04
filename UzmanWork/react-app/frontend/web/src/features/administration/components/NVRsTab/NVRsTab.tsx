import { CircularProgress, Stack, Typography } from "@mui/material";
import { CenteredStack } from "components/styled_components/CenteredStack";
import { useCamerasAdmin, useNVRsAdmin } from "features/administration/hooks";
import { SearchInput } from "components/devices/SearchInput";
import { NVRResponse } from "coram-common-utils";
import { useState } from "react";
import { sortData, useSortable } from "utils/sortable";
import { NVRsSortKeys } from "./types";
import { NVRSettingsDrawer, NVRsTable } from "./components";
import { AbsolutelyCentered } from "components/AbsolutelyCentered";

export function NVRsTab() {
  const {
    isLoading: isNVRsLoading,
    data: nvrs,
    refetch: refetchNvrs,
  } = useNVRsAdmin();
  const { isLoading: isCamerasLoading, data: cameras } = useCamerasAdmin();

  const [searchQuery, setSearchQuery] = useState("");

  const isDataLoading = isNVRsLoading || isCamerasLoading;

  const sortable = useSortable<NVRsSortKeys>("uuid", "desc");
  const sortedNVRs = sortData<NVRResponse>(
    nvrs,
    sortable.orderBy,
    sortable.order
  );

  const filteredNVRs = sortedNVRs.filter(
    (nvr) =>
      searchQuery.length === 0 ||
      nvr.uuid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nvr.org_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [selectedNVR, setSelectedNVR] = useState<NVRResponse | null>(null);

  async function handleCloseNVRSettingsDrawer() {
    setSelectedNVR(null);
  }

  return isDataLoading ? (
    <CenteredStack>
      <CircularProgress size={20} color="secondary" />
    </CenteredStack>
  ) : nvrs.length == 0 ? (
    <AbsolutelyCentered>
      <Typography variant="h2">No NVRs found in the system</Typography>
    </AbsolutelyCentered>
  ) : (
    <>
      <Stack gap={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h3">{nvrs.length} CVRs registered</Typography>
          <SearchInput
            placeHolder="Search by NVR/Organisation"
            value={searchQuery}
            onChange={setSearchQuery}
            sx={{
              width: "20rem",
            }}
          />
        </Stack>
        <NVRsTable
          isDataLoading={isDataLoading}
          nvrs={filteredNVRs}
          cameras={cameras}
          sortable={sortable}
          onNVRSettingsClick={setSelectedNVR}
        />
      </Stack>
      <NVRSettingsDrawer
        nvr={selectedNVR}
        refetchNvrs={refetchNvrs}
        onClose={handleCloseNVRSettingsDrawer}
      />
    </>
  );
}
