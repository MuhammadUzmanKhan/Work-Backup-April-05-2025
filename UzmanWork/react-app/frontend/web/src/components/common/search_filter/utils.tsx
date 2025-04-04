import { NotificationData } from "contexts/notification_context";
import { SearchCbParams } from "./SearchFilter";
import { CancelError } from "coram-common-utils";

export async function handleSearchChange(
  searchParams: SearchCbParams,
  fetchAndUpdate: (params: SearchCbParams) => Promise<void>,
  setLoading: (loading: boolean) => void,
  setNotificationData: (notificationData: NotificationData) => void
): Promise<boolean> {
  try {
    setLoading(true);
    await fetchAndUpdate(searchParams);
    setLoading(false);
    return true;
  } catch (e) {
    setLoading(false);
    // If the error is a CancelError, it means that the user has changed the
    // filter again before the previous fetch has completed. In this case,
    // we can ignore the error.
    if (e instanceof CancelError) {
      return true;
    }
    console.error(e);
    setNotificationData({
      message: "Something went wrong. Please try again later!",
      severity: "error",
    });
    return false;
  }
}
