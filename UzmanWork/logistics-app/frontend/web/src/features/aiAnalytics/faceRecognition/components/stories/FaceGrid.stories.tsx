import type { Meta, StoryObj } from "@storybook/react";
import { FaceGrid } from "../FaceGrid";

const meta: Meta<typeof FaceGrid> = {
  title: "Faces/FaceGrid",
  component: FaceGrid,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FaceGrid>;

const FACES = [
  {
    id: 1,
    s3_signed_url: "https://placehold.co/200x200/000000/FFF?text=Face",
    description: "Face 1",
  },
  {
    id: 2,
    s3_signed_url: "https://placehold.co/200x200?text=Face",
    description: "Face 2",
  },
  {
    id: 3,
    s3_signed_url: "https://placehold.co/200x200/000000/FFF?text=Face",
    description: "Face 3",
  },
  {
    id: 4,
    s3_signed_url: "https://placehold.co/200x200?text=Face",
    description: "Face 4",
  },
  {
    id: 5,
    s3_signed_url: "https://placehold.co/200x200/000000/FFF?text=Face",
    description: "Face 5",
  },
  {
    id: 6,
    s3_signed_url: "https://placehold.co/200x200?text=Face",
    description: "Face 6",
  },
  {
    id: 7,
    s3_signed_url: "https://placehold.co/200x200/000000/FFF?text=Face",
    description: "Face 7",
  },
  {
    id: 8,
    s3_signed_url: "https://placehold.co/200x200?text=Face",
    description: "Face 8",
  },
];

export const Default: Story = {
  render: () => (
    <FaceGrid
      faces={FACES}
      onClick={() => null}
      noFacesMessage="No faces found"
    />
  ),
};
