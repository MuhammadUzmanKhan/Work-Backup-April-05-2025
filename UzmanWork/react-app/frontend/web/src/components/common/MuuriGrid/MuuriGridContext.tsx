import { createContext } from "react";
import { type Item } from "muuri";
import { ElementSize } from "hooks/element_size";

export interface MuuriGridContextValue {
  parentSize: ElementSize;
  addGridItem: (item: HTMLElement) => Item[];
  removeGridItems: (items: Item[]) => Item[];
  updateLayout: VoidFunction;
}

export const MuuriGridContext = createContext<MuuriGridContextValue>({
  parentSize: { width: 0, height: 0 },
  addGridItem: () => [],
  removeGridItems: () => [],
  updateLayout: () => null,
});
