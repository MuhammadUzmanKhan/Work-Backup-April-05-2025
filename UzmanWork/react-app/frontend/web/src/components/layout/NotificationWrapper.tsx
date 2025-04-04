import { Alert, Slide, Snackbar } from "@mui/material";
import type { SlideProps } from "@mui/material";
import {
  NotificationContext,
  NotificationData,
} from "contexts/notification_context";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

const AUTO_HIDE_DURATION = 5000;

function TransitionUp(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export const NotificationWrapper = () => {
  const [notificationData, setNotificationData] = useState<NotificationData>();
  const [open, setOpen] = useState(false);

  let snackBarProps = {};
  let snackBarAutoHideDuration = AUTO_HIDE_DURATION;
  if (notificationData?.props) {
    const { autoHideDuration, ...rest } = notificationData.props;
    snackBarProps = rest;
    snackBarAutoHideDuration = autoHideDuration || AUTO_HIDE_DURATION;
  }

  // Open the snackbar when we have a notification to display
  // and close it after a timeout.
  // NOTE(@lberg): the mui property does not reset
  // the timeout when the snackbar is already open.
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (notificationData) {
      setOpen(true);
      timeout = setTimeout(() => {
        setOpen(false);
      }, snackBarAutoHideDuration);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [notificationData, snackBarAutoHideDuration]);

  return (
    <>
      <NotificationContext.Provider value={{ setNotificationData }}>
        {notificationData && (
          <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            TransitionComponent={TransitionUp}
            {...snackBarProps}
            open={open}
            onClose={(_, reason) => {
              if (reason === "clickaway") return;
              setOpen(false);
            }}
          >
            <Alert
              severity={notificationData.severity}
              {...notificationData.alertProps}
              onClose={() => {
                setOpen(false);
              }}
            >
              {notificationData.message}
            </Alert>
          </Snackbar>
        )}

        <Outlet />
      </NotificationContext.Provider>
    </>
  );
};
