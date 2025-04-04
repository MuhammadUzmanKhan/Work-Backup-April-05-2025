import { Box, Stack, TableCell, TableRow, Tooltip } from "@mui/material";
import { ActionButton } from "components/styled_components/ActionButton";
import { EditIcon } from "icons";
import {
  DeleteOutlineOutlined as DeleteIcon,
  InfoOutlined as InfoOutlinedIcon,
} from "@mui/icons-material";
import { Location } from "coram-common-utils";
import { useConfirmDelete } from "utils/confirm";
import { tableRowStyles } from "./utils";

interface LocationTableRowProps {
  location: Location;
  isLocationAssigned: boolean;
  onEdit: VoidFunction;
  onDelete: () => Promise<void>;
  onInfo: VoidFunction;
}

export function LocationTableRow({
  location,
  isLocationAssigned,
  onEdit,
  onDelete,
  onInfo,
}: LocationTableRowProps) {
  const handleDelete = useConfirmDelete(onDelete);
  return (
    <TableRow sx={{ ...tableRowStyles }}>
      <TableCell>{location.name}</TableCell>
      <TableCell>{location.address}</TableCell>
      <TableCell>
        <Stack direction="row" gap={2} justifyContent="center">
          <ActionButton onClick={onInfo}>
            <InfoOutlinedIcon
              sx={{
                color: "text.primary",
                width: "16px",
                height: "16px",
              }}
            />
          </ActionButton>
          <ActionButton onClick={onEdit}>
            <EditIcon
              sx={{
                color: "text.primary",
                width: "16px",
                height: "16px",
              }}
            />
          </ActionButton>
          <Tooltip
            title={
              isLocationAssigned
                ? "Location with a Coram Point assigned cannot be deleted"
                : ""
            }
          >
            <Box>
              <ActionButton
                disabled={isLocationAssigned}
                onClick={() =>
                  handleDelete(
                    "If you proceed, this location will be lost permanently!"
                  )
                }
              >
                <DeleteIcon
                  sx={{
                    width: "16px",
                    height: "16px",
                  }}
                />
              </ActionButton>
            </Box>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
