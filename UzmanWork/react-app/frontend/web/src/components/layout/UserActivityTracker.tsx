import { useAuth0 } from "@auth0/auth0-react";
import { useLogout } from "hooks/logout";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { useOrganizationContext, isDefined } from "coram-common-utils";
import {
  getLastUserActivity,
  setLastUserActivity,
} from "utils/session_storage";

const USER_INACTIVITY_TIMEOUT_MINUTES = 10;
const INACTIVITY_CHECK_INTERVAL_MS = 1000 * 60;
interface UserActivityTrackerProps {
  children: React.ReactNode;
}

const trackUserActivity = () => {
  setLastUserActivity(DateTime.now());
};

export function UserActivityTracker({ children }: UserActivityTrackerProps) {
  const { isAuthenticated } = useAuth0();
  const { organization } = useOrganizationContext();
  const { logoutHandlerStable } = useLogout();

  useEffect(() => {
    trackUserActivity();
    window.addEventListener("pointerdown", trackUserActivity);
    window.addEventListener("mousemove", trackUserActivity);

    return () => {
      window.removeEventListener("pointerdown", trackUserActivity);
      window.removeEventListener("mousemove", trackUserActivity);
    };
  }, []);

  useEffect(() => {
    const checkUserActivity = setInterval(() => {
      const lastUserActivity = getLastUserActivity();
      if (
        !isDefined(lastUserActivity) ||
        !organization.inactive_user_logout_enabled ||
        !isAuthenticated
      ) {
        return;
      }
      if (!lastUserActivity.isValid) {
        return;
      }
      const diffInMinutes = DateTime.now().diff(lastUserActivity).as("minutes");
      if (diffInMinutes > USER_INACTIVITY_TIMEOUT_MINUTES) {
        logoutHandlerStable.current();
      }
    }, INACTIVITY_CHECK_INTERVAL_MS);

    return () => {
      clearInterval(checkUserActivity);
    };
  }, [
    isAuthenticated,
    logoutHandlerStable,
    organization.inactive_user_logout_enabled,
  ]);

  return <>{children}</>;
}
