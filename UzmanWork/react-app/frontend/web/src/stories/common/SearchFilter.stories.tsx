import type { Meta, StoryObj } from "@storybook/react";
import { SearchFilter } from "components/common/search_filter/SearchFilter";

// TODO(@yawei-ye): Mock service worker
const meta: Meta<typeof SearchFilter> = {
  title: "common/SearchFilter",
  component: SearchFilter,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SearchFilter>;

export const Default: Story = {};
