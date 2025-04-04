import { Stack, Divider, Box } from "@mui/material";
import { CameraResponse } from "coram-common-utils";
import React, { useState } from "react";
import { PaginationNavigator, ITEMS_PER_PAGE } from "./PaginationUtils";
import { NameCell } from "./cameras_table_cells/NameCell";
import { EnableCell } from "./cameras_table_cells/EnableCell";
import { useCameraRenderData } from "./utils";
import { QueryObserverResult } from "react-query";

interface CamerasListProps {
  data: CameraResponse[];
  refetch: () => Promise<QueryObserverResult<CameraResponse[]>>;
}

// Show cameras as a list instead of a table. Should be used on mobile.
export function CamerasList({ data, refetch }: CamerasListProps) {
  const [page, setPage] = useState(0);

  const { visibleData, mostRecentThumbnails } = useCameraRenderData(
    data,
    page,
    ITEMS_PER_PAGE[0],
    "asc",
    "name"
  );
  return (
    <Stack spacing={1} alignItems="center">
      <Stack alignItems="stretch" width="100%">
        {visibleData.map((stream, idx) => (
          <React.Fragment key={idx}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ width: "100%" }}
              p={1}
            >
              {/* TODO status in name cell */}
              <NameCell
                stream={stream}
                refetch={refetch}
                thumbnail={mostRecentThumbnails.get(stream.camera.mac_address)}
                showFullInfo={true}
                thumbnailHeight={45}
                thumbnailWidth={61.5}
                showOnlineStatus={true}
              />
              <EnableCell stream={stream} refetch={refetch} />
            </Stack>
            {idx !== data.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Stack>
      {data.length > ITEMS_PER_PAGE[0] && (
        <Box p={1}>
          <PaginationNavigator
            itemsPerPage={ITEMS_PER_PAGE[0]}
            numItems={data.length}
            size="small"
            page={page}
            setPage={setPage}
          />
        </Box>
      )}
    </Stack>
  );
}
