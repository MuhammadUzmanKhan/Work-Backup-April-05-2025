import { Stack, Button, Typography, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SearchInput } from "components/devices/SearchInput";
import { useMemo, useState } from "react";
import { LocationsTable } from "components/devices/LocationsTable";
import { LocationRegistrationDialog } from "components/devices/LocationsDialog";
import {
  ITEMS_PER_PAGE,
  PaginationData,
  Paginator,
} from "components/devices/PaginationUtils";
import { useCreateLocation } from "features/devices/hooks";
import { Location, NVRResponse, MountIf } from "coram-common-utils";

const HEADER_HEIGHT_PX = 76;

interface LocationTabViewProps {
  nvrs: NVRResponse[];
  locations: Location[];
  nvrAssignedLocationIds: number[];
}

export function LocationTabView({
  nvrs,
  locations,
  nvrAssignedLocationIds,
}: LocationTabViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paginationData, setPaginationData] = useState<PaginationData>({
    page: 0,
    itemsPerPage: ITEMS_PER_PAGE[0],
  });

  const filteredLocations = useMemo(() => {
    if (searchQuery === "") {
      return locations;
    }

    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);

  const { mutateAsync: createLocation } = useCreateLocation();
  return (
    <Stack
      gap={2}
      height={`calc(100vh - ${HEADER_HEIGHT_PX}px)`}
      pt={1.5}
      pl={2.5}
      pr={2.5}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body1">
          {filteredLocations.length} Location Added
        </Typography>
        <Stack direction="row" gap={2}>
          <SearchInput
            placeHolder="Search"
            value={searchQuery}
            onChange={(value: string) => {
              setSearchQuery(value);
              setPaginationData((prev) => ({ ...prev, page: 0 }));
            }}
            sx={{ minWidth: "220px" }}
            textFieldSx={{ input: { py: 0.75 } }}
          />
          <Button
            color="secondary"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            sx={{ borderRadius: "4px" }}
            onClick={() => setDialogOpen(true)}
          >
            <Typography variant="body2">Add New Location</Typography>
          </Button>
        </Stack>
      </Stack>
      <Divider variant="fullWidth" />
      <LocationsTable
        locations={filteredLocations}
        nvrAssignedLocationIds={nvrAssignedLocationIds}
        paginationdata={paginationData}
        nvrs={nvrs}
      />
      <Paginator
        numItems={filteredLocations.length}
        paginationData={paginationData}
        setItemsPerPage={(itemsPerPage) =>
          setPaginationData({
            page: 0,
            itemsPerPage,
          })
        }
        setPage={(page) =>
          setPaginationData((prev) => ({
            ...prev,
            page,
          }))
        }
      />
      <MountIf condition={isDialogOpen}>
        <LocationRegistrationDialog
          open={isDialogOpen}
          title={"Add Location"}
          initialName={""}
          initialAddress={""}
          existingNames={locations.map((loc) => loc.name)}
          onSave={async (newName, newAddress) => {
            await createLocation({ name: newName, address: newAddress });
          }}
          onClose={() => setDialogOpen(false)}
        />
      </MountIf>
    </Stack>
  );
}
