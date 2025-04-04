import type { Meta, StoryObj } from "@storybook/react";
import {
  GroupSelector,
  NestedSelectionData,
} from "components/selector/GroupSelector";
import { useState } from "react";

const GROUP = { id: 0, name: "Group 0" };
const ITEMS = [
  { id: 0, name: "Item 0", group_ids: [0, 1] },
  { id: 1, name: "Item 1", group_ids: [0] },
  { id: 2, name: "Item 2", group_ids: [1] },
];

const meta: Meta<typeof GroupSelector> = {
  title: "Selector/GroupSelector",
  component: GroupSelector,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

function GroupSelectorWrapped(args: Parameters<typeof GroupSelector>[0]) {
  const [selectionData, setSelectionData] = useState<NestedSelectionData>({
    isGroupSelected: false,
    selectedItemIds: [],
  });

  return (
    <GroupSelector
      {...args}
      selectionData={selectionData}
      updateSelectedGroup={(_group, checked) => {
        setSelectionData({
          isGroupSelected: checked,
          selectedItemIds: [],
        });
      }}
      updateSelectedItem={(_groupId, item, checked) => {
        if (checked) {
          selectionData.selectedItemIds.push(item.id);
          if (selectionData.selectedItemIds.length == args.items.length) {
            selectionData.isGroupSelected = true;
            selectionData.selectedItemIds = [];
          }
        } else {
          selectionData.selectedItemIds = selectionData.selectedItemIds.filter(
            (id) => id != item.id
          );
        }
        setSelectionData({ ...selectionData });
      }}
    />
  );
}

export default meta;
type Story = StoryObj<typeof GroupSelector>;

export const Interactions: Story = {
  args: {
    group: GROUP,
    items: ITEMS,
  },
  render: (args) => <GroupSelectorWrapped {...args} />,
};
