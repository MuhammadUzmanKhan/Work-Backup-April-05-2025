import { useRef, useState } from "react";
import { useSyncedState } from "common/hooks";

export function useTextField(value: string, onChange: (value: string) => void) {
  const inputRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useSyncedState(value);

  function handleSave() {
    // Trim the edited value to remove trailing break lines
    const trimmed = editedValue.trimEnd();
    setIsEditing(false);
    inputRef.current?.blur();

    if (trimmed !== value) {
      onChange(trimmed);
    }
  }

  function handleCancel() {
    setEditedValue(value);
    setIsEditing(false);
    inputRef.current?.blur();
  }

  return {
    inputRef,
    isEditing,
    setIsEditing,
    editedValue,
    setEditedValue,
    handleSave,
    handleCancel,
  };
}
