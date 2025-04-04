import type { Meta, StoryObj } from "@storybook/react";
import { GenericSwitch } from "components/devices/cameras_table_cells/GenericSwitch";
import { useState } from "react";

const meta: Meta<typeof GenericSwitch> = {
  title: "Devices/CamerasTable/AlwaysStreamingSwitch",
  component: GenericSwitch,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof GenericSwitch>;

function AlwaysStreamingSwitchWrapped(
  args: Parameters<typeof GenericSwitch>[0]
) {
  const [value, setValue] = useState(args.value);
  const callback = args.callback ?? (async (value) => setValue(value));
  return <GenericSwitch {...args} value={value} callback={callback} />;
}

export const Interactions: Story = {
  args: {
    value: false,
    onSuccessfulUpdate: () => alert("Updated!"),
  },
  render: (args) => <AlwaysStreamingSwitchWrapped {...args} />,
};

export const UpdateFails: Story = {
  args: {
    ...Interactions.args,
    callback: async () => {
      throw new Error("Failed to update");
    },
  },
  render: Interactions.render,
};
