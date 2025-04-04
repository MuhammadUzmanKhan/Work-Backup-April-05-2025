import { createContext } from "react";
import type { AlertProps, SnackbarProps } from "@mui/material";

export interface NotificationData {
  message: string;
  severity: AlertProps["severity"];
  props?: Omit<SnackbarProps, "open" | "onClose">;
  alertProps?: Omit<AlertProps, "onClose">;
}

export interface NotificationContextValue {
  setNotificationData: React.Dispatch<
    React.SetStateAction<NotificationData | undefined>
  >;
}

export const NotificationContext = createContext<NotificationContextValue>({
  setNotificationData: () => null,
});
