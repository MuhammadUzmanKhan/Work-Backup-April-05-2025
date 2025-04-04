import { isDefined } from "./types";
import { createRoot } from "react-dom/client";
import { ConfirmDialog, ConfirmDialogProps } from "ConfirmDialog";
import { CancelablePromise } from "coram-common-utils";

export function confirm(props: ConfirmDialogProps): Promise<boolean> {
  const body = document.querySelector("body");
  if (!isDefined(body)) {
    return Promise.reject("body is not defined");
  }
  const confirmRoot = document.createElement("div");
  body.appendChild(confirmRoot);
  const root = createRoot(confirmRoot);

  return new Promise((res) => {
    const giveAnswer = (answer: boolean) => {
      root.unmount();
      body.removeChild(confirmRoot);
      res(answer);
    };
    root.render(<ConfirmDialog giveAnswer={giveAnswer} outerProps={props} />);
  });
}

export function useConfirmDelete(onDelete: () => void | Promise<void>) {
  async function handleDelete(
    confirmText = "If you proceed, this item will be lost permanently!"
  ) {
    const isConfirmed = await confirm({
      confirmText: confirmText,
      yesText: "Yes, Delete",
      noText: "No, Go Back",
    });
    if (isConfirmed) {
      const result = onDelete();
      if (result instanceof CancelablePromise || result instanceof Promise) {
        await result;
      }
    }

    return isConfirmed;
  }

  return handleDelete;
}
