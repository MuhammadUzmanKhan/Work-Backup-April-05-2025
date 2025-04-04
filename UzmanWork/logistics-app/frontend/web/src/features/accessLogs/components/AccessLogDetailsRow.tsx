import { Box, Collapse, TableCell, TableRow } from "@mui/material";
import { renderDetails } from "./utils";
import { AccessLogCameraInfoMap } from "../types";

interface AccessLogDetailsRowProps {
  open: boolean;
  logDetails: Record<string, string>;
  camerasInfoMap: AccessLogCameraInfoMap;
}

export function AccessLogDetailsRow({
  open,
  logDetails,
  camerasInfoMap: camerasInfoMap,
}: AccessLogDetailsRowProps) {
  return (
    <TableRow
      sx={{
        "& td": { borderLeft: 0 },
        backgroundColor: "rgba(99, 93, 255, 0.05)",
      }}
    >
      <TableCell style={{ padding: 0 }} colSpan={12}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box
            display="grid"
            justifyContent="space-between"
            sx={{
              direction: "row",
              gridTemplateColumns: "1fr 1fr 1fr",
              color: "primary.main",
              py: 1.5,
              "& > *": {
                borderRight: "1px solid #635DFF",
                padding: "0 50px",
              },
              "& > :last-child": {
                borderRight: "none",
              },
            }}
          >
            {renderDetails(logDetails, camerasInfoMap)}
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );
}
