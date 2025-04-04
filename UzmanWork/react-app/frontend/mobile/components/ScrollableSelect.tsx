import {
  ChevronDownIcon,
  Icon,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectPortal,
  SelectScrollView,
  SelectTrigger,
} from "@gluestack-ui/themed";
import React from "react";

interface ScrollableSelectProps
  extends React.ComponentPropsWithRef<typeof Select> {
  isOpened: boolean;
  setIsOpened: (isOpened: boolean) => void;
  selectedValue?: string;
  children: React.ReactNode;
}

export function ScrollableSelect({
  isOpened,
  setIsOpened,
  selectedValue,
  children,
  ...rest
}: ScrollableSelectProps) {
  return (
    <Select {...rest}>
      <SelectTrigger onPress={() => setIsOpened(true)}>
        <SelectInput value={selectedValue} />
        <SelectIcon>
          <Icon as={ChevronDownIcon} />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal isOpen={isOpened} onClose={() => setIsOpened(false)}>
        <SelectBackdrop />
        <SelectContent>
          <SelectDragIndicatorWrapper>
            <SelectDragIndicator />
          </SelectDragIndicatorWrapper>
          <SelectScrollView>{children}</SelectScrollView>
        </SelectContent>
      </SelectPortal>
    </Select>
  );
}
