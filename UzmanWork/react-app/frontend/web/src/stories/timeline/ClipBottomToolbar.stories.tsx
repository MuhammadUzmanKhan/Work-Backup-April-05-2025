import { Meta, StoryObj } from "@storybook/react";
import ClipBottomToolbar from "components/timeline/ClipBottomToolbar";

const meta: Meta<typeof ClipBottomToolbar> = {
  title: "Timeline/ClipBottomToolbar",
  component: ClipBottomToolbar,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof ClipBottomToolbar>;

export const Default: Story = {
  args: {
    cameraName: "Camera name",
    label: "Label for the bottom toolbar",
    urlAndFileNameCb: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { url: "", fileName: "" };
    },
    onShareIconClick: () => alert("Share icon clicked"),
    onArchiveIconClick: () => alert("Archive icon clicked"),
  },
  render: (args) => <ClipBottomToolbar {...args} />,
};
