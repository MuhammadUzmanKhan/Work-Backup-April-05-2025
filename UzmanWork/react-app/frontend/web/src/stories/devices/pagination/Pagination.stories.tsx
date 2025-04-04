import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  ITEMS_PER_PAGE,
  PaginationNavigator,
  PaginationSelector,
} from "components/devices/PaginationUtils";
import { Stack } from "@mui/material";

const meta: Meta<typeof PaginationNavigator> = {
  title: "Devices/Pagination",
  component: PaginationNavigator,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PaginationNavigator>;

function PaginationWrapped(args: Parameters<typeof PaginationNavigator>[0]) {
  const [page, setPage] = useState(0);
  return <PaginationNavigator {...args} page={page} setPage={setPage} />;
}

export const Interactions: Story = {
  args: {
    itemsPerPage: 10,
    numItems: 100,
  },
  render: (args) => <PaginationWrapped {...args} />,
};

function PaginationWithSelector(
  args: Parameters<typeof PaginationNavigator>[0]
) {
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  return (
    <Stack direction="row" alignItems="center" gap={2}>
      <PaginationSelector
        {...args}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        itemsPerPageOptions={ITEMS_PER_PAGE}
      />
      <PaginationNavigator
        {...args}
        itemsPerPage={itemsPerPage}
        page={page}
        setPage={setPage}
      />
    </Stack>
  );
}

export const WithSelector: Story = {
  args: {
    numItems: 100,
  },
  render: (args) => <PaginationWithSelector {...args} />,
};
