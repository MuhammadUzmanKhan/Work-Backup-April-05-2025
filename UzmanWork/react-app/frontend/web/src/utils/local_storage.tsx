import { WallParams } from "components/wall/WallFilters";
import { isDefined } from "./types";

const GRID_WIDTH_KEY_PREFIX = "live_grid_width_perc";
const WALL_GRID_WIDTH_KEY_PREFIX = "wall_grid_width_perc_";
const SHOW_CAMERA_FULL_INFO_KEY = "show_camera_full_info";
const ORGANIZATION_ID_KEY = "organization_key";
const SELECTED_WALL_PARAMS_KEY = "selected_wall_filters";

export function setGridWidthInStorage(gridWidth: number) {
  localStorage.setItem(GRID_WIDTH_KEY_PREFIX, gridWidth.toString());
}

export function getGridWidthInStorage() {
  const gridWidth = localStorage.getItem(GRID_WIDTH_KEY_PREFIX);
  return gridWidth !== null ? Number(gridWidth) : 100;
}

export function setWallGridWidthInStorage(
  wallId: number | null,
  gridWidth: number
) {
  localStorage.setItem(
    WALL_GRID_WIDTH_KEY_PREFIX + `${wallId}`,
    gridWidth.toString()
  );
}

export function getWallGridWidthInStorage(wallId: number | null) {
  const gridWidth = localStorage.getItem(
    WALL_GRID_WIDTH_KEY_PREFIX + `${wallId}`
  );
  return gridWidth !== null ? Number(gridWidth) : 100;
}

export function setCameraFullInfoInStorage(value: boolean) {
  localStorage.setItem(SHOW_CAMERA_FULL_INFO_KEY, value.toString());
}

export function getCameraFullInfoInStorage() {
  const value = localStorage.getItem(SHOW_CAMERA_FULL_INFO_KEY);
  if (value == null) {
    // if not set, assume we want to show full info
    return true;
  }
  return value === "true";
}

export async function setOrganizationIdInStorage(orgId: number) {
  localStorage.setItem(ORGANIZATION_ID_KEY, orgId.toString());
}

export async function getOrganizationIdInStorage() {
  const orgId = localStorage.getItem(ORGANIZATION_ID_KEY);
  return orgId !== null ? parseInt(orgId) : null;
}

export function setWallParamsInStorage(wallParams: WallParams) {
  if (!isDefined(wallParams.organization)) {
    return;
  }
  const allWallFilters = getWallParamsInStorage();
  allWallFilters.set(wallParams.organization.id, wallParams);
  localStorage.setItem(
    SELECTED_WALL_PARAMS_KEY,
    JSON.stringify([...allWallFilters])
  );
}

function getWallParamsInStorage(): Map<number, WallParams> {
  const params = localStorage.getItem(SELECTED_WALL_PARAMS_KEY);
  return params !== null ? new Map(JSON.parse(params)) : new Map();
}

export function getOrgWallParamsInStorage(orgId: number): WallParams | null {
  const params = getWallParamsInStorage();
  return params.get(orgId) ?? null;
}
