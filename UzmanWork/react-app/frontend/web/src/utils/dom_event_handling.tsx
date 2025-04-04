import { BaseSyntheticEvent } from "react";

export function preventEventBubbling(ev: BaseSyntheticEvent) {
  ev.stopPropagation();
}
