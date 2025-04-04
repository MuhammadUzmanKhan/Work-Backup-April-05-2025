import { Circle, Group, Text } from "react-konva";
import Konva from "konva";
import { useTheme } from "@mui/material";

interface ClearLineDrawingButtonProps {
  position: Konva.Vector2d;
  onClick: () => void;
  onMouseEnter: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  onMouseLeave: (event: Konva.KonvaEventObject<MouseEvent>) => void;
}

export function ClearLineDrawingButton({
  position,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ClearLineDrawingButtonProps) {
  const theme = useTheme();

  return (
    <Group
      x={position.x}
      y={position.y}
      onClick={onClick}
      onTap={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Circle radius={12} fill={theme.palette.primary.main} strokeWidth={2} />
      <Text
        text="×"
        fontSize={18}
        fontFamily="Arial"
        fill="white"
        align="center"
        verticalAlign="middle"
        offsetX={5}
        offsetY={7}
      />
    </Group>
  );
}
