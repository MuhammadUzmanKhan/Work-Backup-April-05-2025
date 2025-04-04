import { useReducer } from "react";

export interface TimelineBarSelectors {
  showInfo: boolean;
  showSearch: boolean;
  showTimelapse: boolean;
  showAlert: boolean;
  showAnalyticsControls: boolean;
  showJourney: boolean;
}
const initialSelectorState: TimelineBarSelectors = {
  showInfo: false,
  showSearch: false,
  showTimelapse: false,
  showAlert: false,
  showAnalyticsControls: false,
  showJourney: false,
};

const getAllSelectorsFalse = (state: TimelineBarSelectors) => {
  const selectors = { ...state };
  Object.keys(selectors).forEach((value: string) => {
    selectors[value as keyof TimelineBarSelectors] = false;
  });
  return selectors;
};

export enum selectorsEnum {
  showInfo = "showInfo",
  showSearch = "showSearch",
  showTimelapse = "showTimelapse",
  showAlert = "showAlert",
  showAnalyticsControls = "showAnalyticsControls",
  showJourney = "showJourney",
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
    case selectorsEnum.showInfo:
      return { ...getAllSelectorsFalse(state), showInfo: true };
    case selectorsEnum.showSearch:
      return { ...getAllSelectorsFalse(state), showSearch: true };
    case selectorsEnum.showTimelapse:
      return { ...getAllSelectorsFalse(state), showTimelapse: true };
    case selectorsEnum.showAlert:
      return { ...getAllSelectorsFalse(state), showAlert: true };
    case selectorsEnum.showAnalyticsControls:
      return { ...getAllSelectorsFalse(state), showAnalyticsControls: true };
    case selectorsEnum.showJourney:
      return { ...getAllSelectorsFalse(state), showJourney: true };
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
