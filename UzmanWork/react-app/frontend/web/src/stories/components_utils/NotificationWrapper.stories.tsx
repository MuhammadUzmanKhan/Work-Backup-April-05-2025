import { Stack, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { NotificationContext } from "contexts/notification_context";
import { useContext } from "react";

const meta: Meta<typeof Stack> = {
  title: "ComponentUtils/NotificationWrapper",
  component: Stack,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

function Wrapped() {
  const { setNotificationData } = useContext(NotificationContext);

  return (
    <Stack direction="row">
      <Button
        onClick={() =>
          setNotificationData({ message: "Info message", severity: "info" })
        }
      >
        Show Info
      </Button>
      <Button
        onClick={() =>
          setNotificationData({
            message: "Success message",
            severity: "success",
          })
        }
      >
        Show Success
      </Button>
      <Button
        onClick={() =>
          setNotificationData({ message: "Error message", severity: "error" })
        }
      >
        Show Error
      </Button>
      <Button
        onClick={() =>
          setNotificationData({
            message: "Error message",
            severity: "error",
            props: {
              anchorOrigin: { vertical: "top", horizontal: "center" },
            },
            alertProps: {
              sx: {
                backgroundColor: "orange",
              },
            },
          })
        }
      >
        Show Custom
      </Button>
    </Stack>
  );
}

export default meta;
type Story = StoryObj<typeof Stack>;

export const TestNotifications: Story = {
  render: (args) => <Wrapped {...args} />,
};
