import { Avatar, Stack, TableCell, TableRow, Typography } from "@mui/material";
import { EventDetailTableRow, FavoriteCameraTableCell } from "./components";
import { AugumentedAccessPointEventResponse } from "features/accessControl/types";
import { useState } from "react";
import { SUPPORTED_VENDORS } from "features/accessControl/consts";
import { DEFAULT_TIMEZONE } from "coram-common-utils";
import { getEventResultDisplayValue } from "./utils";
import { SUCCESS_EVENT_RESULTS } from "./consts";

interface EventTableRowProps {
  event: AugumentedAccessPointEventResponse;
}

export function EventTableRow({ event }: EventTableRowProps) {
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);

  const favoriteCamera =
    event.cameras.find((camera) => camera.isFavorite) ?? event.cameras[0];

  const otherCameras = event.cameras.filter(
    (camera) => camera !== favoriteCamera
  );

  const showEventDetails = eventDetailsOpen && otherCameras.length > 0;

  const eventTimezone = favoriteCamera?.timezone ?? DEFAULT_TIMEZONE;

  const hasSuccessResult = SUCCESS_EVENT_RESULTS.includes(
    event.result.toLowerCase()
  );

  return (
    <>
      <TableRow>
        <TableCell>
          <Stack
            direction="row"
            spacing={1}
            justifyContent="start"
            alignItems="center"
          >
            {SUPPORTED_VENDORS[event.vendor]?.icon}
            <Stack>
              <Typography variant="body2">{event.description}</Typography>
              <Typography variant="body2" color="#83889E">
                {SUPPORTED_VENDORS[event.vendor]?.name ?? "N/A"}
              </Typography>
            </Stack>
          </Stack>
        </TableCell>
        <TableCell>
          <Stack>
            <Typography variant="body2">
              {event.time
                .setZone(eventTimezone)
                .toFormat("MM/dd/yy, h:mm a ZZZZ")}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell>
          <Typography
            variant="body2"
            color={hasSuccessResult ? "secondary" : "#FF7223"}
          >
            {getEventResultDisplayValue(event.result)}
          </Typography>
        </TableCell>
        <TableCell>
          {event.actor && (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="start"
              alignItems="center"
            >
              <Avatar
                sx={{
                  bgcolor: "neutral.200",
                  color: "common.black",
                  fontSize: "14px",
                  width: "25px",
                  height: "25px",
                }}
              >
                {event.actor.charAt(0)}
              </Avatar>
              <Typography variant="body2">{event.actor}</Typography>
            </Stack>
          )}
        </TableCell>
        <FavoriteCameraTableCell
          favoriteCamera={favoriteCamera}
          hasDetails={otherCameras.length > 0}
          detailsOpen={eventDetailsOpen}
          toggleDetails={() => setEventDetailsOpen(!eventDetailsOpen)}
        />
      </TableRow>
      {showEventDetails && <EventDetailTableRow cameras={otherCameras} />}
    </>
  );
}
