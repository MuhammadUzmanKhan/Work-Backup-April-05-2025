import type { Meta, StoryObj } from "@storybook/react";
import {
  INITIAL_ERROR_STATE,
  PanelSubmitButton,
} from "components/timeline/common_panel/PanelSubmitButton";
import { ErrorState } from "components/timeline/utils";
import { useState } from "react";

const meta: Meta<typeof PanelSubmitButton> = {
  title: "Timeline/common_panel/PanelSubmitButton",
  component: PanelSubmitButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PanelSubmitButton>;
type PanelSubmitButtonWithSetterProps = Parameters<
  typeof PanelSubmitButton
>[0] & {
  initial_error_state?: ErrorState;
};

const PanelSubmitButtonWithSetter = (
  args: PanelSubmitButtonWithSetterProps
) => {
  const [errors, setErrors] = useState<ErrorState>(
    args.initial_error_state ?? INITIAL_ERROR_STATE
  );
  return <PanelSubmitButton {...args} errors={errors} setErrors={setErrors} />;
};

export const Default: Story = {
  args: {
    processClickCb: async () => {
      // Simulate processing by waiting 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    buttonTextCb: (isLoading: boolean) => (isLoading ? "Loading" : "Submit"),
  },
  render: (args) => <PanelSubmitButtonWithSetter {...args} />,
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    isDisabled: true,
  },
  render: (args) => <PanelSubmitButtonWithSetter {...args} />,
};

export const StartError: Story = {
  args: Default.args,
  render: (args) => (
    <PanelSubmitButtonWithSetter
      {...args}
      initial_error_state={{
        ...INITIAL_ERROR_STATE,
        isStartTimeInvalid: true,
        errorMessage: "Error",
      }}
    />
  ),
};

export const EndError: Story = {
  args: Default.args,
  render: (args) => (
    <PanelSubmitButtonWithSetter
      {...args}
      initial_error_state={{
        ...INITIAL_ERROR_STATE,
        isEndTimeInvalid: true,
        errorMessage: "Error",
      }}
    />
  ),
};

export const TimeError: Story = {
  args: Default.args,
  render: (args) => (
    <PanelSubmitButtonWithSetter
      {...args}
      initial_error_state={{
        ...INITIAL_ERROR_STATE,
        isStartTimeInvalid: true,
        isEndTimeInvalid: true,
        errorMessage: "Error",
      }}
    />
  ),
};

export const ErrorDuringSubmit: Story = {
  args: {
    ...Default.args,
    processClickCb: () => {
      throw new Error("Error during submit");
    },
  },
  render: (args) => <PanelSubmitButtonWithSetter {...args} />,
};
