import { CreateWallRequestPartial, generateTilesInSquareGrid } from "./utils";

export const WALL_THREE_BY_THREE: CreateWallRequestPartial = {
  name: "New Wall",
  wall_tiles: generateTilesInSquareGrid(3),
};
