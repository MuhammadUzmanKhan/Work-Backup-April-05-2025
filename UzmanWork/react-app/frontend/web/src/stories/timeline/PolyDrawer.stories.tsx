import { Box, Button, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/react";
import { PolyDrawer } from "components/timeline/PolyDrawer";
import { useRef, useState } from "react";
import { DrawingMode, DrawingState, DrawingStateContext } from "utils/drawing";
import { useElementSizeFromEl } from "hooks/element_size";

const meta: Meta<typeof PolyDrawer> = {
  title: "Timeline/PolyDrawer",
  component: PolyDrawer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PolyDrawer>;

function PolyDrawerWithContext(
  args: Parameters<typeof PolyDrawer>[0] & { initialDrawingState: DrawingState }
) {
  const [drawingState, setDrawingState] = useState<DrawingState>(
    args.initialDrawingState
  );
  const boxRef = useRef<HTMLElement>(null);
  const { size } = useElementSizeFromEl(boxRef.current);

  return (
    <DrawingStateContext.Provider value={{ drawingState, setDrawingState }}>
      <Box
        ref={boxRef}
        maxWidth={400}
        minHeight={200}
        position="relative"
        sx={{
          resize: "both",
          overflow: "auto",
          border: "1px solid black",
        }}
      >
        <PolyDrawer {...args} videoSize={size} />
      </Box>
      <Button
        sx={{
          mt: 1,
        }}
        variant="contained"
        onClick={() => {
          setDrawingState((drawingState) => ({
            ...drawingState,
            rects: [],
            polygons: [],
          }));
        }}
      >
        Clear
      </Button>
      <Typography variant="body1" data-testid="polys-count">
        {`Rects: ${drawingState.rects.length} Polys: ${drawingState.polygons.length}`}
      </Typography>
    </DrawingStateContext.Provider>
  );
}

export const RectangleInteraction: Story = {
  render: (args) => (
    <PolyDrawerWithContext
      {...args}
      initialDrawingState={{
        rects: [],
        polygons: [],
        drawingMode: DrawingMode.Rectangle,
      }}
    />
  ),
};

export const PolygonInteraction: Story = {
  render: (args) => (
    <PolyDrawerWithContext
      {...args}
      initialDrawingState={{
        rects: [],
        polygons: [],
        drawingMode: DrawingMode.Polygon,
      }}
    />
  ),
};
