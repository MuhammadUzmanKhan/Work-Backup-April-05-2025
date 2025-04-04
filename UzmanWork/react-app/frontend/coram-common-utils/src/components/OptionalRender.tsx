import React from "react";

// This component renders children when condition is true only.
// This will force children to unmount when the condition is false and mount
// when the condition is true. This is especially useful for Modal and Dialog if:
// - We have states we want to reset when the modal/dialog is closed;
export function MountIf({
  condition,
  children,
}: {
  condition: boolean;
  children: React.ReactNode;
}) {
  return condition ? <>{children}</> : <></>;
}
