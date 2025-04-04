import type { Meta, StoryObj } from "@storybook/react";
import { FaceProfileCreator } from "../FaceProfileCreator";
import { UNIQUE_FACE_RESPONSE, handlers } from "./utils";

const meta: Meta<typeof FaceProfileCreator> = {
  title: "Faces/FaceProfileCreator",
  component: FaceProfileCreator,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    msw: {
      handlers: { ...handlers },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FaceProfileCreator>;

export const Default: Story = {
  render: () => (
    <FaceProfileCreator
      selectedFace={UNIQUE_FACE_RESPONSE}
      refetchProfile={() => null}
    />
  ),
};
