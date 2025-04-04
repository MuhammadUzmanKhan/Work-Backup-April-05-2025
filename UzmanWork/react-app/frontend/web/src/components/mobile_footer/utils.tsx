import { MoreIcon } from "icons/more-icon";
import { BottomNavItem } from "./BottomNavBar";

export const ITEMS_PER_ROW = 4;

export const MORE_ITEM = {
  title: "More",
  path: null,
  icon: <MoreIcon />,
};
export const LESS_ITEM = {
  title: "Less",
  path: null,
  icon: <MoreIcon />,
};

export function chunkNavItemsIntoRows(
  items: BottomNavItem[],
  menuItem: BottomNavItem,
  itemsPerRow: number
) {
  const organizedNavItems = [...items];
  organizedNavItems.splice(itemsPerRow - 1, 0, menuItem);
  const chunkedRows = chunkArrayIntoRows(organizedNavItems, ITEMS_PER_ROW);
  return chunkedRows;
}

// Function to chunk items into groups of `size` (rows in this case)
export const chunkArrayIntoRows = <T,>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
