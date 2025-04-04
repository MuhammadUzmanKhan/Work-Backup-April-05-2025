import {
  CameraResponse,
  CreateWallRequest,
  SharedWallResponse,
  UserWallsResponse,
  WallResponse,
  WallTile,
  getTimezoneFromCamera,
} from "coram-common-utils";
import { WallLayout } from "components/wall/WallLayoutSelector";

const THREE_BY_THREE_ASYMMETRIC_TILES: WallTile[] = [
  { x_start_tile: 0, y_start_tile: 0, width_tiles: 2, height_tiles: 2 },
  { x_start_tile: 2, y_start_tile: 0, width_tiles: 1, height_tiles: 1 },
  { x_start_tile: 2, y_start_tile: 1, width_tiles: 1, height_tiles: 1 },
  { x_start_tile: 0, y_start_tile: 2, width_tiles: 1, height_tiles: 1 },
  { x_start_tile: 1, y_start_tile: 2, width_tiles: 1, height_tiles: 1 },
  { x_start_tile: 2, y_start_tile: 2, width_tiles: 1, height_tiles: 1 },
];

export const MAX_WALL_NAME_LENGTH = 20;

export type GeneralWallResponse = WallResponse | SharedWallResponse;

export function isWallResponse(
  wall: GeneralWallResponse
): wall is WallResponse {
  return "share_infos" in wall;
}

export function wallsEmpty(userWalls: UserWallsResponse) {
  return userWalls.walls.length === 0 && userWalls.shared_walls.length === 0;
}

export interface CreateWallRequestPartial extends Partial<CreateWallRequest> {
  name: string;
  wall_tiles: Array<WallTile>;
}

export function generateTilesFromLayout(layout: WallLayout): WallTile[] {
  if (layout == WallLayout.ThreeByThreeAsymmetric) {
    return THREE_BY_THREE_ASYMMETRIC_TILES;
  } else if (
    [
      WallLayout.TwoByTwo,
      WallLayout.ThreeByThree,
      WallLayout.FourByFour,
      WallLayout.FiveByFive,
      WallLayout.SixBySix,
    ].includes(layout)
  ) {
    // TODO(@lberg): I don't like using the enum value as an int here
    return generateTilesInSquareGrid(layout);
  } else {
    throw new Error("Programmer error: Unknown layout");
  }
}

export function generateTilesInSquareGrid(size: number): WallTile[] {
  return Array.from({ length: size * size }, (_, idx) => ({
    x_start_tile: idx % size,
    y_start_tile: Math.floor(idx / size),
    width_tiles: 1,
    height_tiles: 1,
  }));
}

function compareTiles(tile1: WallTile, tile2: WallTile) {
  if (tile1.y_start_tile !== tile2.y_start_tile) {
    return tile1.y_start_tile - tile2.y_start_tile;
  }
  return tile1.x_start_tile - tile2.x_start_tile;
}

export function tilesAreFromLayout(tilesA: WallTile[], layout: WallLayout) {
  const tilesB = generateTilesFromLayout(layout);
  if (tilesA.length != tilesB.length) {
    return false;
  }

  const tilesAsorted = tilesA.sort((tile1, tile2) => {
    return compareTiles(tile1, tile2);
  });
  const tilesBsorted = tilesB.sort((tile1, tile2) => {
    return compareTiles(tile1, tile2);
  });

  for (let i = 0; i < tilesAsorted.length; i++) {
    if (
      tilesAsorted[i].x_start_tile != tilesBsorted[i].x_start_tile ||
      tilesAsorted[i].y_start_tile != tilesBsorted[i].y_start_tile ||
      tilesAsorted[i].width_tiles != tilesBsorted[i].width_tiles ||
      tilesAsorted[i].height_tiles != tilesBsorted[i].height_tiles
    ) {
      return false;
    }
  }
  return true;
}

export function adaptWallTilesToLayout(
  wallTiles: WallTile[],
  layout: WallLayout
): WallTile[] {
  const wallTilesFilled = wallTiles.filter((tile) => tile.camera_mac_address);
  const newTiles: WallTile[] = generateTilesFromLayout(layout);
  // NOTE(@lberg): this is a very naive implementation, we are just pushing from
  // top-left to bottom-right, regardless of the previous layout.
  for (let i = 0; i < Math.min(wallTilesFilled.length, newTiles.length); i++) {
    newTiles[i].camera_mac_address = wallTilesFilled[i].camera_mac_address;
  }
  return newTiles;
}

function range(size: number, startAt = 0): ReadonlyArray<number> {
  return [...Array(size).keys()].map((i) => i + startAt);
}

// Parses a grid of wall tiles and returns a boolean array with true if a
// tile is in a empty row. For multi-row tiles, all rows must be empty.
export function parseWallTiles(wall_tiles: WallTile[]) {
  const nonEmptyRows = new Set(
    wall_tiles
      .filter((tile) => tile.camera_mac_address)
      .flatMap((tile) => {
        return range(tile.height_tiles, tile.y_start_tile);
      })
  );

  const tilesInEmptyRow = wall_tiles.map(
    (tile) =>
      range(tile.height_tiles, tile.y_start_tile).filter((rowIdx) =>
        nonEmptyRows.has(rowIdx)
      ).length === 0
  );
  return tilesInEmptyRow;
}

export function findFreeWallName(wallNames: string[]) {
  const freeUntitledWallId: number = wallNames.reduce(
    (maxId: number, str: string) => {
      const match = str.match(/untitled_wall_(\d+)/);
      if (match) {
        const wallId = parseInt(match[1], 10);
        return Math.max(wallId + 1, maxId);
      }
      return maxId;
    },
    1
  );
  return `untitled_wall_${freeUntitledWallId}`;
}

export function concatAndSortWalls(
  walls: WallResponse[],
  sharedWalls: SharedWallResponse[]
) {
  const allWalls = [...walls, ...sharedWalls];
  const sortedWalls = allWalls.sort((a, b) => a.wall.id - b.wall.id);
  return sortedWalls;
}

// Given a list of walls and a deleted wall id, find the "next" wall to show
// (next can either be the preceding or succeeding wall).
export function getNextWall(
  walls: GeneralWallResponse[],
  deletedWallId: number
) {
  if (walls.length <= 1) {
    return -1;
  }

  const idx = walls.findIndex((wall) => wall.wall.id === deletedWallId);
  if (idx == -1) {
    return -1;
  }

  // Next wall id can be preceding or succeeding wall,
  // depending on index (note we are guaranteed to have at least one
  // other wall).
  const nextIdxInArray = idx > 0 ? idx - 1 : idx + 1;
  const nextWallIdx = walls[nextIdxInArray].wall.id;
  return nextWallIdx;
}

export function getTimezoneFromTiles(
  cameras: CameraResponse[],
  tiles: WallTile[]
) {
  const firstCameraInTiles = cameras.find((cam) =>
    tiles
      .map((tile) => tile.camera_mac_address)
      .includes(cam.camera.mac_address)
  );
  return getTimezoneFromCamera(firstCameraInTiles);
}

const MAX_VISIBLE_WALLS = 4;

// Filter the walls to only show the first MAX_VISIBLE_WALLS, or all if there
// are less than MAX_VISIBLE_WALLS.
// If there are more, and we select a wall that is not in the first
// MAX_VISIBLE_WALLS, we change the ordering to show this as last entry.
export function partitionWalls(
  userWalls: UserWallsResponse,
  currentWallId: number | null
) {
  const sortedWalls = concatAndSortWalls(
    userWalls.walls,
    userWalls.shared_walls
  );
  const currentWallIdx = sortedWalls.findIndex(
    (element) => element.wall.id === currentWallId
  );

  // If findIndex fails to find the element, it returns -1.
  // This case should not happen, but it still complies to the
  // following logic - we skip the following if statement
  // and simply partition the walls into visible- and dropdownWalls.
  if (currentWallIdx >= MAX_VISIBLE_WALLS) {
    const [currentWall] = sortedWalls.splice(currentWallIdx, 1);
    // Make use uf a side effect of splice, removing 0
    // elements and adding currentWall at the selected position.
    sortedWalls.splice(MAX_VISIBLE_WALLS - 1, 0, currentWall);
  }

  const visibleWalls = sortedWalls.slice(0, MAX_VISIBLE_WALLS);
  const dropdownWalls = sortedWalls.slice(MAX_VISIBLE_WALLS);

  return { visibleWalls, dropdownWalls };
}
