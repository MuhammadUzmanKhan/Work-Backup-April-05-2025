import { CancelError, CancelablePromise } from "../backend_client";

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
