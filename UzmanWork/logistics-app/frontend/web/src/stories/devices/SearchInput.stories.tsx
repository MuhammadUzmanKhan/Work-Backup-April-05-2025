import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "components/devices/SearchInput";
import { useState } from "react";

const meta: Meta<typeof SearchInput> = {
  title: "Devices/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

function WrappedSearchInput() {
  const [value, setValue] = useState("");
  return <SearchInput placeHolder="Search" value={value} onChange={setValue} />;
}

export const InteractionSearchInput: Story = {
  render: WrappedSearchInput,
};
