import type { Meta, StoryObj } from "@storybook/react";

import { Stack } from "@mui/material";
import {
  WallLayout,
  WallLayoutSelector,
} from "components/wall/WallLayoutSelector";
import archive_handlers from "mocks/archive_handlers";
import thumbnail_query_handler from "mocks/thumbnail_query_handler";
import { useState } from "react";

const meta: Meta<typeof WallLayoutSelector> = {
  title: "LiveView/LiveWallLayoutSelector",
  component: WallLayoutSelector,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: { ...archive_handlers, ...thumbnail_query_handler },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WallLayoutSelector>;

function LiveWallLayoutSelectorWrapped(
  args: Parameters<typeof WallLayoutSelector>[0]
) {
  const [wallLayout, setWallLayout] = useState<WallLayout>(
    WallLayout.ThreeByThree
  );
  return (
    <Stack>
      <WallLayoutSelector
        {...args}
        layout={wallLayout}
        onLayoutChange={setWallLayout}
      />
    </Stack>
  );
}

export const Interactions: Story = {
  args: {
    availableLayouts: [
      WallLayout.ThreeByThree,
      WallLayout.FourByFour,
      WallLayout.FiveByFive,
    ],
  },

  render: (args) => <LiveWallLayoutSelectorWrapped {...args} />,
};
