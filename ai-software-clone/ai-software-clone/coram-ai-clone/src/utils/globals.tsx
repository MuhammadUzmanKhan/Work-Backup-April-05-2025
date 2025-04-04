import { atom } from "recoil";

export const isSidebarOpenState = atom<boolean>({
  key: "isSidebarOpenState",
  default: false,
});

export const userState = atom({
  key: "userState",
  default: {},
});

export const authenticatedState = atom({
  key: "authenticatedState",
  default: false,
});

export interface PolyDrawerRectCoordinates {
  height: number;
  width: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}
