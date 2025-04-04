import {
  isDefined,
  useFetchMostRecentThumbnailEnlarged,
} from "coram-common-utils";
import { Box, Fade, Stack } from "@mui/material";
import { useElementSize } from "hooks/element_size";
import { LineCrossingDirectionSelector } from "./LineCrossingDirectionSelector";
import { type LineCrossingCameraDataSource } from "coram-common-utils";
import { LineDrawer } from "./LineDrawer";
import { LoadingBox } from "components/video/LoadingBox";
import { useState } from "react";
import { CANVAS_Z_INDEX_FOREGROUND } from "components/video/VideoPlayer";

interface CameraDatasourceLineDrawerProps {
  dataSource: LineCrossingCameraDataSource;
  onDataSourceUpdate: (dataSource: LineCrossingCameraDataSource) => void;
}

export function CameraDatasourceLineDrawer({
  dataSource,
  onDataSourceUpdate,
}: CameraDatasourceLineDrawerProps) {
  const { size, setRef } = useElementSize();

  const [cursor, setCursor] = useState("default");

  const thumbnailLocalURL = useFetchMostRecentThumbnailEnlarged({
    cameraMacAddress: dataSource.mac_address,
  });

  const thumbnailIsLoaded = isDefined(thumbnailLocalURL);

  return (
    <Stack gap={1} alignItems="flex-end">
      <LineCrossingDirectionSelector
        lineCrossingDirection={dataSource.direction}
        setLineCrossingDirection={(direction) =>
          onDataSourceUpdate({ ...dataSource, direction })
        }
      />
      <Box position="relative" boxSizing="border-box" width="100%">
        {!thumbnailIsLoaded && <LoadingBox />}
        <Fade in={thumbnailIsLoaded} timeout={200}>
          <Box>
            <Box
              src={thumbnailLocalURL}
              component="img"
              display="block"
              width="100%"
              sx={{
                aspectRatio: "16/9",
              }}
              ref={setRef}
            />
            <Box
              width="100%"
              height="100%"
              left={0}
              top={0}
              position="absolute"
              display="flex"
              justifyContent="center"
              alignItems="center"
              zIndex={CANVAS_Z_INDEX_FOREGROUND}
              sx={{ cursor }}
            >
              <LineDrawer
                width={size.width}
                height={size.height}
                lineDirection={dataSource.direction}
                initialLine={
                  isDefined(dataSource.line)
                    ? {
                        start: {
                          x: dataSource.line.start_point.x,
                          y: dataSource.line.start_point.y,
                        },
                        end: {
                          x: dataSource.line.end_point.x,
                          y: dataSource.line.end_point.y,
                        },
                      }
                    : undefined
                }
                onLineChange={(line) =>
                  onDataSourceUpdate({
                    ...dataSource,
                    line: { start_point: line.start, end_point: line.end },
                  })
                }
                onCursorChange={setCursor}
              />
            </Box>
          </Box>
        </Fade>
      </Box>
    </Stack>
  );
}
