import { Button, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { useState } from "react";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { WallIcon } from "./WallIcon";
import { Layout2x2 } from "components/personal_wall/svgs/Layout2x2";
import { Layout3x3 } from "components/personal_wall/svgs/Layout3x3";
import { Layout4x4 } from "components/personal_wall/svgs/Layout4x4";
import { Layout5x5 } from "components/personal_wall/svgs/Layout5x5";
import { Layout6x6 } from "components/personal_wall/svgs/Layout6x6";
import { Layout3x3Asymmetric } from "components/personal_wall/svgs/Layout3x3_asymmetric";
import { LayoutSVGProps } from "components/personal_wall/svgs/utils";

export enum WallLayout {
  Invalid = 0,
  TwoByTwo = 2,
  ThreeByThree = 3,
  FourByFour = 4,
  FiveByFive = 5,
  SixBySix = 6,
  ThreeByThreeAsymmetric = 7,
}

export const LAYOUT_TO_ICON: Record<
  Exclude<WallLayout, WallLayout.Invalid>,
  (props: LayoutSVGProps) => JSX.Element
> = {
  [WallLayout.TwoByTwo]: Layout2x2,
  [WallLayout.ThreeByThree]: Layout3x3,
  [WallLayout.FourByFour]: Layout4x4,
  [WallLayout.FiveByFive]: Layout5x5,
  [WallLayout.SixBySix]: Layout6x6,
  [WallLayout.ThreeByThreeAsymmetric]: Layout3x3Asymmetric,
};

export const LAYOUT_TO_TEXT: Record<WallLayout, string> = {
  [WallLayout.TwoByTwo]: "2x2",
  [WallLayout.ThreeByThree]: "3x3",
  [WallLayout.FourByFour]: "4x4",
  [WallLayout.FiveByFive]: "5x5",
  [WallLayout.SixBySix]: "6x6",
  [WallLayout.ThreeByThreeAsymmetric]: "Custom",
  [WallLayout.Invalid]: "Invalid",
};

interface WallLayoutSelectorProps {
  layout: WallLayout;
  onLayoutChange: (layout: WallLayout) => void;
  availableLayouts?: WallLayout[];
  iconWidth?: number;
}

export function WallLayoutSelector({
  layout,
  onLayoutChange,
  availableLayouts = Object.values(WallLayout) as WallLayout[],
  iconWidth = 20,
}: WallLayoutSelectorProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        onClick={(ev) => setAnchorEl(ev.currentTarget)}
        sx={{
          color: "neutral.1000",
          padding: "0",
        }}
      >
        <Stack
          border="1px solid lightgray"
          borderRadius={0.5}
          direction="row"
          sx={{
            padding: "9px 5px 3px 10px",
            minWidth: "3rem",
            justifyContent: "space-between",
            "&:hover": {
              transform: "scale(1.01)",
              border: "1px solid #3FC79A",
            },
          }}
        >
          <WallIcon
            layout={layout}
            highlight={true}
            width={iconWidth}
          ></WallIcon>
          {open ? (
            <ExpandLessIcon
              sx={{
                color: "neutral.400",
              }}
            />
          ) : (
            <ExpandMoreIcon
              sx={{
                color: "neutral.400",
              }}
            />
          )}
        </Stack>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{ sx: { mt: 0.4 } }}
      >
        {availableLayouts.map((availableLayout, index) => (
          <MenuItem
            key={index}
            onClick={() => {
              setAnchorEl(null);
              if (layout != availableLayout) {
                onLayoutChange(availableLayout);
              }
            }}
          >
            <Stack direction="row" spacing={1}>
              <WallIcon
                layout={availableLayout}
                highlight={layout == availableLayout}
                width={iconWidth}
              />
              <Typography>{LAYOUT_TO_TEXT[availableLayout]}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
