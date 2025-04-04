
import { notification } from "antd";
import { ReactNode } from "react";

interface NotificationProps {
  message: string;
  description?: string;
  duration?: number;
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  icon?: ReactNode;
  showProgress?: boolean;
  pauseOnHover?: boolean;
}

const customNotification = {
  success: (
    message: string = "Success!",
    description?: string,
    duration = 2,
    placement: NotificationProps['placement'] = "topRight",
    showProgress = true,
    pauseOnHover = true,
  ) => {
    notification.success({
      message,
      description,
      duration,
      placement,
      showProgress,
      pauseOnHover,
    });
  },
  error: (
    message: string = "Error!",
    description?: string,
    duration = 4,
    placement: NotificationProps['placement'] = "topRight",
    showProgress = true,
    pauseOnHover = true,
  ) => {
    if (message !== 'Invalid session.' && description !== 'Invalid session.')
      notification.error({
        message,
        description,
        duration,
        placement,
        showProgress,
        pauseOnHover,
      });
  },
  info: (
    message: string = "Info!",
    description?: string,
    duration = 2,
    placement: NotificationProps['placement'] = "topRight",
    showProgress = true,
    pauseOnHover = true,
  ) => {
    notification.info({
      message,
      description,
      duration,
      placement,
      showProgress,
      pauseOnHover,
    });
  },
  warning: (
    message: string = "Warning!",
    description?: string,
    duration = 2,
    placement: NotificationProps['placement'] = "topRight",
    showProgress = true,
    pauseOnHover = true,
  ) => {
    notification.warning({
      message,
      description,
      duration,
      placement,
      showProgress,
      pauseOnHover,
    });
  },
  custom: ({
    message,
    description = "",
    duration = 2,
    placement = "topRight",
    icon,
    showProgress = true,
    pauseOnHover = true,
  }: NotificationProps) => {
    notification.open({
      message,
      description,
      duration,
      placement,
      icon,
      showProgress,
      pauseOnHover,
    });
  },
};

export default customNotification;
