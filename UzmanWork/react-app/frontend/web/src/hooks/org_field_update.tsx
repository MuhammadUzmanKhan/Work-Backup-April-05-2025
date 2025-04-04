import { NotificationContext } from "contexts/notification_context";
import { useContext, useMemo, useState } from "react";
import { useMutation } from "react-query";

export type FieldOptionType = string | number;

export interface FieldOption<T extends FieldOptionType> {
  value: T;
  label: string;
}

export function useOrgFieldUpdate<T extends FieldOptionType>(
  orgFieldInitialValue: T,
  allFieldOptions: FieldOption<T>[],
  getLabel: (value: T) => string
) {
  const [orgField, setOrgField] = useState(orgFieldInitialValue);

  // Only add the current field option if it's not already in the list
  // This is to handle legacy field options that are not in the list
  const extendedFieldOptions = useMemo(() => {
    return allFieldOptions.find((option) => option.value === orgField)
      ? allFieldOptions
      : [...allFieldOptions, { value: orgField, label: getLabel(orgField) }];
  }, [orgField, allFieldOptions, getLabel]);

  return {
    orgField,
    setOrgField,
    extendedFieldOptions,
  };
}

export function useOrgFieldCallback<T>(
  callback: (fieldValue: T) => Promise<void>,
  errorMsg: string,
  successMsg: string,
  refetch: () => void
) {
  const { setNotificationData } = useContext(NotificationContext);

  const { mutateAsync: handleInputChange, isLoading } = useMutation(callback, {
    onError: () => {
      setNotificationData({
        message: errorMsg,
        severity: "error",
      });
    },
    onSuccess: () => {
      setNotificationData({
        message: successMsg,
        severity: "success",
      });
      refetch();
    },
  });

  return {
    isLoading,
    handleInputChange,
  };
}
