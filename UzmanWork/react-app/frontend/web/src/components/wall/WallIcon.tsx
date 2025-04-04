import { WallLayout, LAYOUT_TO_ICON } from "./WallLayoutSelector";

interface WallIconProps {
  layout: WallLayout;
  highlight: boolean;
  width: number;
}

export function WallIcon({ layout, highlight, width }: WallIconProps) {
  if (layout == WallLayout.Invalid) {
    return <></>;
  }
  if (layout in LAYOUT_TO_ICON) {
    const Icon = LAYOUT_TO_ICON[layout];
    return (
      <Icon
        key={layout}
        color={highlight ? "#10b981" : "#c3c9d4"}
        width={width}
      ></Icon>
    );
  }
  return <></>;
}
