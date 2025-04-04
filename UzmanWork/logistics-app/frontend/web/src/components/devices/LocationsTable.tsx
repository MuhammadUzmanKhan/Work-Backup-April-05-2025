import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Location, NVRResponse } from "coram-common-utils";
import { LocationRegistrationDialog } from "./LocationsDialog";
import { useState } from "react";
import {
  useDeleteLocation,
  useUpdateLocationAddress,
  useUpdateLocationName,
} from "features/devices/hooks";
import { PaginationData } from "./PaginationUtils";
import { LocationTableRow } from "./LocationsTableRow";
import { LocationsDetailsDrawer } from "../../features/devices/components/LocationsDetailsDrawer";

interface LocationsTableProps {
  locations: Location[];
  nvrAssignedLocationIds: number[];
  paginationdata: PaginationData;
  nvrs: NVRResponse[];
}

export function LocationsTable({
  locations,
  nvrAssignedLocationIds,
  paginationdata,
  nvrs,
}: LocationsTableProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );
  const [openLocationDrawer, setOpenLocationDrawer] = useState(false);
  const { mutateAsync: updateLocationName } = useUpdateLocationName();
  const { mutateAsync: updateLocationAddress } = useUpdateLocationAddress();
  const { mutateAsync: deleteLocation } = useDeleteLocation();

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          flexGrow: 1,
          boxShadow: "none",
        }}
      >
        <Table
          stickyHeader
          sx={{
            minWidth: "100%",
            tableLayout: "fixed",
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell width="40%">
                <Typography variant="body2">Location Name</Typography>
              </TableCell>
              <TableCell width="50%">
                <Typography variant="body2">Location Address</Typography>
              </TableCell>
              <TableCell width="10%">
                <Typography variant="body2">Actions</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations
              .sort((a, b) => (a.id > b.id ? 1 : -1))
              .slice(
                paginationdata.page * paginationdata.itemsPerPage,
                (paginationdata.page + 1) * paginationdata.itemsPerPage
              )
              .map((location) => (
                <LocationTableRow
                  key={location.id}
                  location={location}
                  isLocationAssigned={nvrAssignedLocationIds.includes(
                    location.id
                  )}
                  onEdit={() => setSelectedLocation(location)}
                  onDelete={() => deleteLocation(location.id)}
                  onInfo={() => setOpenLocationDrawer(true)}
                />
              ))}
            <LocationsDetailsDrawer
              open={openLocationDrawer}
              onClose={() => setOpenLocationDrawer(false)}
              nvrs={nvrs}
            />
          </TableBody>
        </Table>
      </TableContainer>
      {selectedLocation && (
        <LocationRegistrationDialog
          open={selectedLocation !== null}
          onClose={() => setSelectedLocation(null)}
          title={"Edit Location"}
          initialName={selectedLocation.name}
          initialAddress={selectedLocation.address}
          existingNames={locations.map((loc) => loc.name)}
          onSave={async (newName, newAddress) => {
            // Check if name or address has changed
            const { name: originalName = "", address: originalAddress = "" } =
              locations.find((loc) => loc.id === selectedLocation.id) || {};

            const nameChanged = newName !== originalName;
            const addressChanged = newAddress !== originalAddress;

            // Update name if changed
            if (nameChanged) {
              await updateLocationName({
                location_id: selectedLocation.id,
                name: newName,
              });
            }

            // Update address if changed
            if (addressChanged) {
              await updateLocationAddress({
                location_id: selectedLocation.id,
                address: newAddress,
              });
            }
          }}
        />
      )}
    </>
  );
}
