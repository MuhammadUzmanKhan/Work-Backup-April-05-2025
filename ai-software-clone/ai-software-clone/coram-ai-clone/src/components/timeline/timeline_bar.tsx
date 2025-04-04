import { useReducer } from "react";

export interface TimelineBarSelectors {
  showSearch: boolean;
  showAlert: boolean;
}
const initialSelectorState: TimelineBarSelectors = {
  showSearch: false,
  showAlert: false,
};

const getAllSelectorsFalse = (state: TimelineBarSelectors) => {
  const selectors = { ...state };
  Object.keys(selectors).forEach((value: string) => {
    selectors[value as keyof TimelineBarSelectors] = false;
  });
  return selectors;
};

export enum selectorsEnum {
  showSearch = "showSearch",
  showAlert = "showAlert",
  default = "default",
}

const timelineBarSelectorsReducer = (
  state: TimelineBarSelectors,
  { type, scrollToTop = true }: { type: selectorsEnum; scrollToTop?: boolean }
) => {
  if (scrollToTop) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  switch (type) {
    case selectorsEnum.showSearch:
      return { ...getAllSelectorsFalse(state), showSearch: true };
    default:
      return initialSelectorState;
  }
};

export function useTimelineBarSelectors() {
  const [timelineBarSelector, dispatch] = useReducer(
    timelineBarSelectorsReducer,
    initialSelectorState
  );

  return {
    timelineBarSelector,
    dispatch,
  };
}
