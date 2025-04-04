import { Stack } from "@mui/material";
import { TimelineBar } from "../components/timeline/TimelineBar";
import {
  useTimelineBarSelectors,
  selectorsEnum,
} from "../components/timeline/timeline_bar";
import {
  DrawingState,
  DrawingStateContext,
  INITIAL_DRAWING_STATE,
} from "../contexts/drawing";
import { useCallback, useEffect, useState } from "react";
import Grid from "@mui/material/Unstable_Grid2";
import { SearchPanel } from "../components/panels/SearchPanel";
// import { useRef } from "react";

export function TimelinePage() {
  const { timelineBarSelector, dispatch } = useTimelineBarSelectors();
  const [drawingState, setDrawingState] = useState<DrawingState>(
    INITIAL_DRAWING_STATE
  );
  useEffect(() => {
    if (timelineBarSelector.showAlert && drawingState.closeIconPosition) {
      setDrawingState((state) => ({
        ...state,
        closeIconPosition: undefined,
      }));
    }
  }, [timelineBarSelector.showAlert, drawingState.closeIconPosition]);

  // const panelContainerRef = useRef<HTMLDivElement>(null);
  const clearDrawings = useCallback(
    () =>
      setDrawingState((state) => ({
        ...state,
        rects: [],
        polygons: [],
        closeIconPosition: undefined,
      })),
    [setDrawingState]
  );
  //******TODO: */ Render the canvas if we are in drawing mode

  // const canvasFn = useCallback(
  //   (props: CanvasDrawProps) => {
  //     if (drawingState.drawingMode === DrawingMode.FullImage) {
  //       return <></>;
  //     }
  //     return <PolyDrawer {...props} />;
  //   },
  //   [drawingState.drawingMode]
  // );

  return (
    <DrawingStateContext.Provider value={{ drawingState, setDrawingState }}>
      <Stack pl={10} gap={3} pt={8}>
        <TimelineBar
          timelineBarSelectors={timelineBarSelector}
          onSearchIconClick={() => dispatch({ type: selectorsEnum.showSearch })}
          onNewAlertIconClick={() =>
            dispatch({ type: selectorsEnum.showAlert })
          }
        />

        <Grid container spacing={2}>
          <Grid
            xs={9.5}
            display="flex"
            justifyContent="center"
            position="relative"
          >
            <iframe
              style={{ borderRadius: "16px" }}
              width="100%"
              height="540"
              title="YouTube Video"
              // src="https://www.youtube.com/embed/ZBCUegTZF7M?autoplay=1&mute=1"
              src="https://www.youtube.com/watch?v=ZBCUegTZF7M&t=14596s"
              allowFullScreen
            ></iframe>
          </Grid>
          {timelineBarSelector.showSearch && (
            <Grid xs={2}>
              <SearchPanel
                clearDrawings={clearDrawings}
                onCloseClick={() => dispatch({ type: selectorsEnum.default })}
              />
            </Grid>
          )}
        </Grid>
      </Stack>
    </DrawingStateContext.Provider>
  );
}
