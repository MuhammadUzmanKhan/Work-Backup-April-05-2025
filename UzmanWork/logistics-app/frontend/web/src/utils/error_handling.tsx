import { ApiError, CancelError, CancelablePromise } from "coram-common-utils";
import { NotificationData } from "contexts/notification_context";

export function matchApiException(error: unknown, targetErrorMessage: string) {
  return (
    error instanceof ApiError &&
    error.body["detail"].startsWith(targetErrorMessage)
  );
}

export function getFetchAndRefetchHandler(
  refetch: () => Promise<unknown>,
  setNotificationData: (notificationData: NotificationData) => void
) {
  return async function handleErrorAndRefetch(
    cb: () => Promise<void>,
    errorMessage: string | ((e: unknown) => string)
  ) {
    try {
      await cb();
      refetch();
      return true;
    } catch (e) {
      const errorMessageValue =
        typeof errorMessage === "string" ? errorMessage : errorMessage(e);
      setNotificationData({
        message: errorMessageValue,
        severity: "error",
      });
      console.error(e);
      return false;
    }
  };
}

export async function handleRequestWithAbort(
  promise: CancelablePromise<void>,
  signal?: AbortSignal
) {
  // Abort the request if the component is unmounted.
  signal?.addEventListener("abort", () => promise.cancel());
  try {
    await promise;
  } catch (e) {
    if (e instanceof CancelError) {
      return;
    }
  }
}
