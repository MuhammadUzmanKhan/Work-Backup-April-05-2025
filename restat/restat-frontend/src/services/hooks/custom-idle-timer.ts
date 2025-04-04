import { useIdleTimer } from "react-idle-timer";
import { useState, useEffect } from "react";
import { AUTH_TOKEN } from "../constants";
import Alert from 'sweetalert2';
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { apis } from "../apis";
import { handleAuthLogout } from "./handleLogout";

const useCustomIdleTimer = (timeout: number | null) => {
  const [isIdleTimerActive, setIsIdleTimerActive] = useState<boolean>(true);
  const { user: { user } } = useSelector((state: RootState) => state);
  const token = localStorage.getItem(AUTH_TOKEN);
  if (timeout === null) timeout = 900000

  const onIdle = async () => {
    try {
      await apis.revokeUserSession(user.id);
    } catch (e) {
      console.error(e);
    }
    handleAuthLogout("You have been logged out due to inactivity. Please login again when you are ready to work again!");
  };

  const onPrompt = () => {
    Alert.fire({
      title: "Logout Warning",
      text: "Hey! we want to protect your account and make sure you are working on it, please click below to confirm or you will be logged out automatically because of inactivity.",
      icon: "question",
      showCancelButton: false,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Confirm",
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) reset();
    })
  };

  useEffect(() => {
    setIsIdleTimerActive(!!token);
  }, [token]);

  const { getRemainingTime, reset } = useIdleTimer(
    isIdleTimerActive && timeout
      ? {
        onIdle,
        onPrompt,
        promptBeforeIdle: timeout === 60000 ? 30000 : 120000,
        timeout: timeout,
        throttle: 500,
      }
      : {
        timeout: 1,
        disabled: true
      }
  );
  return { getRemainingTime }
};

export default useCustomIdleTimer;
