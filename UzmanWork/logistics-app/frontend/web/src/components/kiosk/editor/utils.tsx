import { Wall } from "coram-common-utils";

export enum KioskType {
  STATIC_WALL = "static_wall",
  ROTATING_WALL = "rotating_wall",
}

export enum KioskDrawerMode {
  Create = "Create",
  Edit = "Edit",
}

export interface UpdateWallsForKioskParams {
  walls: Wall[];
  rotateFrequencyS: number;
}

export const DEFAULT_ROTATE_FREQUENCY_S = 30;
export const MIN_ROTATE_FREQUENCY_ALLOWED_S = 10;

export function getKioskType(wall_count: number): KioskType {
  if (wall_count <= 1) {
    return KioskType.STATIC_WALL;
  } else {
    return KioskType.ROTATING_WALL;
  }
}
