import { Stack, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SearchInput } from "./SearchInput";
import { ExportButton, ExportConfig } from "./ExportButton";
import { isDefined } from "coram-common-utils";

interface TabsRightViewControls {
  searchInput: string;
  addButtonTitle: string;
  onSearchChange: (value: string) => void;
  onAddButtonClick: VoidFunction;
  exportConfig?: ExportConfig;
}

export function TabsRightViewControls({
  searchInput,
  addButtonTitle,
  onSearchChange,
  onAddButtonClick,
  exportConfig = undefined,
}: TabsRightViewControls) {
  return (
    <Stack direction="row" gap={2} px={3}>
      <SearchInput
        placeHolder="Search"
        value={searchInput}
        onChange={onSearchChange}
        sx={{ minWidth: "220px" }}
        textFieldSx={{ input: { py: 0.75 } }}
      />
      {isDefined(exportConfig) && <ExportButton exportConfig={exportConfig} />}

      <Button
        color="secondary"
        variant="contained"
        startIcon={<AddIcon fontSize="small" />}
        sx={{ borderRadius: "4px" }}
        onClick={() => onAddButtonClick()}
      >
        <Typography variant="body2">{addButtonTitle}</Typography>
      </Button>
    </Stack>
  );
}
