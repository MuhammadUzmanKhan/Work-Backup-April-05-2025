import { Box, Stack, useTheme } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

export interface NestedSelectorGroup {
  id: number;
  name: string;
}

export interface NestedSelectorItem {
  id: number;
  name: string;
  groupIds?: number[];
}

export interface NestedSelectionData {
  isGroupSelected: boolean;
  selectedItemIds: number[];
}

interface GroupSelectorProps {
  items: NestedSelectorItem[];
  group: NestedSelectorGroup;
  selectionData: NestedSelectionData;
  updateSelectedGroup: (group: NestedSelectorGroup, checked: boolean) => void;
  updateSelectedItem: (
    groupId: number,
    item: NestedSelectorItem,
    checked: boolean
  ) => void;
}

export function GroupSelector({
  items,
  group,
  selectionData,
  updateSelectedGroup,
  updateSelectedItem,
}: GroupSelectorProps) {
  const theme = useTheme();
  return (
    <Box>
      <FormControlLabel
        label={group.name}
        control={
          <Checkbox
            inputProps={
              {
                "data-testid": `group-${group.id}`,
              } as React.InputHTMLAttributes<HTMLInputElement>
            }
            checked={selectionData.isGroupSelected}
            indeterminate={selectionData.selectedItemIds.length > 0}
            onChange={(ev) => updateSelectedGroup(group, ev.target.checked)}
            style={{
              color: theme.palette.secondary.main,
            }}
          />
        }
      />
      <Stack sx={{ ml: 3 }}>
        {items.map((item) => (
          <FormControlLabel
            key={item.id}
            label={item.name}
            control={
              <Checkbox
                inputProps={
                  {
                    "data-testid": `group-${group.id}-item-${item.id}`,
                  } as React.InputHTMLAttributes<HTMLInputElement>
                }
                checked={
                  selectionData.selectedItemIds.find(
                    (selectedItemId) => item.id == Number(selectedItemId)
                  ) !== undefined || selectionData.isGroupSelected
                }
                onChange={(ev) =>
                  updateSelectedItem(group.id, item, ev.target.checked)
                }
                disabled={selectionData.isGroupSelected}
                sx={{
                  color: theme.palette.secondary.main,
                  "&.Mui-checked": {
                    color: theme.palette.secondary.main,
                  },
                  "&.Mui-disabled": {
                    color: "lightgray",
                  },
                }}
              />
            }
          />
        ))}
      </Stack>
    </Box>
  );
}
