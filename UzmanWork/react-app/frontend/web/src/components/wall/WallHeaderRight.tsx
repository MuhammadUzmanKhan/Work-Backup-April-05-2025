import { Stack } from "@mui/material";
import { DesktopOnly } from "components/layout/DesktopOnly";
import { WallLayout, WallLayoutSelector } from "./WallLayoutSelector";
import { WallSizeSelector } from "components/personal_wall/utils/WallSizeSelector";
import { FullScreenButton } from "components/FullScreenButton";
import { SearchInput } from "components/devices/SearchInput";

interface WallHeaderRightProps {
  wallLayout: WallLayout;
  setWallLayout: (layout: WallLayout) => void;
  gridWidthPerc: number;
  setAndSaveGridWidthPerc: (gridWidth: number) => void;
  wallGridContainer: HTMLDivElement | null;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export function WallHeaderRight({
  wallLayout,
  setWallLayout,
  gridWidthPerc,
  setAndSaveGridWidthPerc,
  wallGridContainer,
  searchQuery,
  onSearchQueryChange,
}: WallHeaderRightProps) {
  return (
    <Stack
      justifyContent="space-between"
      direction="row"
      alignItems="center"
      gap={1.5}
    >
      <DesktopOnly>
        <SearchInput
          placeHolder="Search"
          value={searchQuery}
          onChange={onSearchQueryChange}
          sx={{ minWidth: "150px" }}
        />

        <WallLayoutSelector
          layout={wallLayout}
          availableLayouts={[
            WallLayout.ThreeByThree,
            WallLayout.FourByFour,
            WallLayout.FiveByFive,
            WallLayout.SixBySix,
          ]}
          onLayoutChange={setWallLayout}
        />
        <WallSizeSelector
          value={gridWidthPerc}
          minValue={30}
          maxValue={100}
          step={10}
          onChange={setAndSaveGridWidthPerc}
        />
        <FullScreenButton targetElement={wallGridContainer} />
      </DesktopOnly>
    </Stack>
  );
}
