import type { Meta, StoryObj } from "@storybook/react";
import { FaceRenderer } from "../FaceRenderer";

const meta: Meta<typeof FaceRenderer> = {
  title: "Faces/FaceRenderer",
  component: FaceRenderer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FaceRenderer>;

const FACE = {
  id: 1,
  s3_signed_url: "https://placehold.co/200x200/000000/FFF?text=Face",
  description: "Face",
};

export const Default: Story = {
  render: () => <FaceRenderer face={FACE} />,
};
