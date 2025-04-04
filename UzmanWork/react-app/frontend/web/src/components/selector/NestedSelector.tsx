import {
  Box,
  Button,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SxProps } from "@mui/system";
import type { TypographyProps } from "@mui/material/Typography";
import React from "react";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from "@mui/icons-material";

import {
  GroupSelector,
  NestedSelectorItem,
  NestedSelectorGroup,
  NestedSelectionData,
} from "./GroupSelector";
import { isDefined } from "coram-common-utils";

interface NestedSelectorProps {
  items: Map<number, NestedSelectorItem>;
  groups: Map<number, NestedSelectorGroup>;
  selectionData: Map<number, NestedSelectionData>;
  label: string;
  onChange: (selectionData: Map<number, NestedSelectionData>) => void;
  onClick: (selectionData: Map<number, NestedSelectionData>) => void;
  onClose: (selectionData: Map<number, NestedSelectionData>) => void;
  onOpen?: (selectionData: Map<number, NestedSelectionData>) => void;
  displayDoneButton?: boolean;
  selectorProps?: TypographyProps;
  sx?: SxProps;
  disabled: boolean;
}

export function NestedSelector({
  items,
  groups,
  selectionData,
  displayDoneButton = false,
  label,
  onChange,
  onClick,
  onClose,
  onOpen,
  selectorProps,
  sx,
  disabled,
}: NestedSelectorProps) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);

  function updateSelectedGroup(group: NestedSelectorGroup, checked: boolean) {
    const selectionDataNew = new Map(selectionData);
    if (checked) {
      selectionDataNew.set(group.id, {
        isGroupSelected: true,
        selectedItemIds: [],
      } as NestedSelectionData);
    } else {
      selectionDataNew.delete(group.id);
    }
    onChange(selectionDataNew);
  }

  function updateSelectedItem(
    groupId: number,
    item: NestedSelectorItem,
    checked: boolean
  ) {
    const selectionDataNew = new Map(selectionData);

    if (checked) {
      const groupData =
        selectionDataNew.get(groupId) ||
        ({
          isGroupSelected: false,
          selectedItemIds: [],
        } as NestedSelectionData);
      // Add the group to the selected groups
      groupData.selectedItemIds.push(item.id);
      selectionDataNew.set(groupId, groupData);
      // If we have all the camera for this camera group, select the group
      const allItemsOneGroup = Array.from(items.values()).filter((item) =>
        item.groupIds?.includes(groupId)
      );
      if (groupData.selectedItemIds.length == allItemsOneGroup.length) {
        groupData.isGroupSelected = true;
        groupData.selectedItemIds = [];
      }
    } else {
      const groupData = selectionDataNew.get(groupId);
      if (groupData === undefined) {
        console.warn(`${groupId} not found in ${selectionDataNew}`);
        return;
      }
      groupData.selectedItemIds = groupData.selectedItemIds.filter(
        (selectedItemId) => selectedItemId != item.id
      );
      selectionDataNew.set(groupId, groupData);
    }
    onChange(selectionDataNew);
  }

  const isOpen = Boolean(anchorEl) && !disabled;

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        border={1}
        borderColor="#DFE0E6"
        p={1}
        onClick={(event) => {
          isDefined(onOpen) && onOpen(selectionData);
          setAnchorEl(event.currentTarget);
        }}
        data-testid="items-selector"
        sx={{
          cursor: disabled ? "auto" : "pointer",
          ...sx,
        }}
      >
        {!disabled ? (
          <Typography
            variant="body2"
            data-testid="items-selector-test"
            sx={{
              color: "neutral.1000",
              ...selectorProps,
            }}
          >
            {label}
          </Typography>
        ) : (
          <Tooltip
            title="Admin has access to all the cameras"
            placement="left-start"
          >
            <Typography
              variant="body2"
              sx={{ color: "neutral.400", ...selectorProps }}
            >
              {label}
            </Typography>
          </Tooltip>
        )}
        {!disabled &&
          (isOpen ? (
            <KeyboardArrowUpIcon fontSize="small" />
          ) : (
            <KeyboardArrowDownIcon fontSize="small" />
          ))}
      </Stack>
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => {
          !displayDoneButton && onClose(selectionData); // Execute the action only if the done button is not enabled
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{ sx: { mt: 1, minWidth: "14rem" } }}
      >
        <Box p={2}>
          {Array.from(groups.values())
            .sort((group1, group2) => group1.id - group2.id)
            .map((group) => (
              <GroupSelector
                key={group.id}
                items={Array.from(items.values()).filter((item) =>
                  item.groupIds?.includes(group.id)
                )}
                group={group}
                selectionData={
                  selectionData.get(group.id) || {
                    isGroupSelected: false,
                    selectedItemIds: [],
                  }
                }
                updateSelectedGroup={updateSelectedGroup}
                updateSelectedItem={updateSelectedItem}
              ></GroupSelector>
            ))}
          {displayDoneButton && (
            <Button
              sx={{
                mt: 2,
                backgroundColor: "secondary.main",
                borderRadius: "0.3rem",
              }}
              fullWidth
              size="small"
              variant="contained"
              onClick={() => {
                onClick(selectionData);
                setAnchorEl(null);
              }}
            >
              Done
            </Button>
          )}
        </Box>
      </Popover>
    </>
  );
}
