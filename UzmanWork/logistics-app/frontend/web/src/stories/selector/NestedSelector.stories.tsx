import type { Meta, StoryObj } from "@storybook/react";
import { NestedSelector } from "components/selector/NestedSelector";
import { locationSelectionFromRestrictions } from "components/settings/utils";
import { useState } from "react";

const GROUPS = new Map([
  [0, { id: 0, name: "Location 0" }],
  [1, { id: 1, name: "Location 1" }],
]);

const ITEMS = new Map([
  [0, { id: 0, name: "Camera 0", groupIds: [0, 1] }],
  [1, { id: 1, name: "Camera 1", groupIds: [0] }],
  [2, { id: 2, name: "Camera 2", groupIds: [1] }],
]);

const meta: Meta<typeof NestedSelector> = {
  title: "Selector/NestedSelector",
  component: NestedSelector,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NestedSelector>;

function NestedSelectorWrapped(props: Parameters<typeof NestedSelector>[0]) {
  const [selectionData, setSelectionData] = useState(
    props.selectionData || new Map()
  );
  return (
    <NestedSelector
      {...props}
      selectionData={selectionData}
      onChange={setSelectionData}
      onClick={setSelectionData}
      onClose={setSelectionData}
    />
  );
}

export const NoInitialRestrictions: Story = {
  args: {
    groups: GROUPS,
    items: ITEMS,
    disabled: false,
    label: "Camera Access",
  },

  render: (args) => <NestedSelectorWrapped {...args} />,
};

export const Disabled: Story = {
  args: {
    ...NoInitialRestrictions.args,
    disabled: true,
    label: "All Cameras",
  },
  render: (args) => <NestedSelectorWrapped {...args} />,
};

export const FullAccess: Story = {
  args: {
    ...NoInitialRestrictions.args,
    selectionData: locationSelectionFromRestrictions(GROUPS, {
      full_access: true,
    }),
  },
  render: (args) => <NestedSelectorWrapped {...args} />,
};

export const InitialLocation: Story = {
  args: {
    ...NoInitialRestrictions.args,
    selectionData: locationSelectionFromRestrictions(GROUPS, {
      full_access: false,
      location_ids: [0],
    }),
  },
  render: (args) => <NestedSelectorWrapped {...args} />,
};

export const InitialCameras: Story = {
  args: {
    ...NoInitialRestrictions.args,
    selectionData: locationSelectionFromRestrictions(GROUPS, {
      full_access: false,
      camera_groups: [
        { location_id: 0, camera_group_id: 0 },
        { location_id: 1, camera_group_id: 2 },
      ],
    }),
  },
  render: (args) => <NestedSelectorWrapped {...args} />,
};

export const InitialLocationsAndCameras: Story = {
  args: {
    ...NoInitialRestrictions.args,
    selectionData: locationSelectionFromRestrictions(GROUPS, {
      full_access: false,
      location_ids: [0],
      camera_groups: [{ location_id: 1, camera_group_id: 2 }],
    }),
  },
  render: (args) => <NestedSelectorWrapped {...args} />,
};

export const EmptyLocation: Story = {
  args: {
    ...NoInitialRestrictions.args,
    groups: new Map([...GROUPS, [2, { id: 2, name: "Location 2" }]]),
  },
  render: (args) => <NestedSelectorWrapped {...args} />,
};

export const CustomSelectorStyle: Story = {
  args: {
    ...NoInitialRestrictions.args,
    selectorProps: {
      fontWeight: "bold",
      fontSize: "24px",
      color: "green",
    },
  },
  render: (args) => <NestedSelectorWrapped {...args} />,
};
