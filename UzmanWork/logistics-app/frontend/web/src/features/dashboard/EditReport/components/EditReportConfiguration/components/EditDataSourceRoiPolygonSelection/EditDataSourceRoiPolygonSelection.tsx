import {
  DrawingState,
  DrawingStateContext,
  INITIAL_DRAWING_STATE,
} from "utils/drawing";
import {
  DisplayDataSourceRoiPolygonSelection,
  DrawingModeSelector,
} from "./components";
import { Stack } from "@mui/material";
import { CameraDataSourceWithROI } from "coram-common-utils";
import { useEffect, useRef, useState } from "react";
import { roiFromDrawingState } from "utils/user_alerts";
import { useOnMount } from "hooks/lifetime";
import { areRoiEqual, getDrawingStateFromDataSource } from "./utils";

interface EdiDataSourceRoiPolygonSelectionProps {
  dataSource: CameraDataSourceWithROI;
  onDataSourceUpdate: (dataSource: CameraDataSourceWithROI) => void;
}

export function EditDataSourceRoiPolygonSelection({
  dataSource,
  onDataSourceUpdate,
}: EdiDataSourceRoiPolygonSelectionProps) {
  const [drawingState, setDrawingState] = useState<DrawingState>(
    getDrawingStateFromDataSource(dataSource)
  );

  useOnMount(() => {
    setDrawingState(getDrawingStateFromDataSource(dataSource));
  });

  const hasRoiChanged = !areRoiEqual(
    roiFromDrawingState(drawingState),
    dataSource.roi_polygon
  );

  const onDataSourceUpdateRef = useRef(onDataSourceUpdate);
  onDataSourceUpdateRef.current = onDataSourceUpdate;
  useEffect(() => {
    if (!hasRoiChanged) {
      return;
    }

    onDataSourceUpdateRef.current?.({
      mac_address: dataSource.mac_address,
      roi_polygon: roiFromDrawingState(drawingState),
    });
  }, [drawingState, dataSource.mac_address, hasRoiChanged]);

  return (
    <DrawingStateContext.Provider value={{ drawingState, setDrawingState }}>
      <Stack gap={1} alignItems="flex-end">
        <DrawingModeSelector
          drawingMode={drawingState.drawingMode}
          setDrawingMode={(drawingMode) => {
            setDrawingState({ ...INITIAL_DRAWING_STATE, drawingMode });
          }}
        />
        <DisplayDataSourceRoiPolygonSelection
          key={dataSource.mac_address}
          cameraMacAddress={dataSource.mac_address}
        />
      </Stack>
    </DrawingStateContext.Provider>
  );
}
