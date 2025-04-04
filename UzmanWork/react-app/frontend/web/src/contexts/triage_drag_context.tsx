import { VisiblePortion } from "components/zoom_free_timeline/utils";
import { TimeInterval } from "utils/time";
import { DateTime } from "luxon";
import { createContext } from "react";

export interface TriageDragStatus {
  isDragging: boolean;
  time: DateTime;
  visiblePortion: VisiblePortion;
  timeInterval: TimeInterval;
}

export const DEFAULT_TRIAGE_DRAG_STATUS: TriageDragStatus = {
  isDragging: false,
  time: DateTime.now(),
  visiblePortion: {
    startRatio: 0,
    endRatio: 1,
  },
  timeInterval: {
    timeStart: DateTime.invalid("Not initialized"),
    timeEnd: DateTime.invalid("Not initialized"),
  },
};

export const TriageDragContext = createContext<{
  triageDragStatus: TriageDragStatus;
  setTriageDragStatus: React.Dispatch<React.SetStateAction<TriageDragStatus>>;
}>({
  triageDragStatus: DEFAULT_TRIAGE_DRAG_STATUS,
  setTriageDragStatus: () => null,
});
