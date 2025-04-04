import { JourneyService } from "coram-common-utils";
import { NotificationContext } from "contexts/notification_context";
import { DateTime } from "luxon";
import { useContext } from "react";
import { useQuery } from "react-query";
import { formatDateTime } from "utils/dates";
import {
  TrackThumbnailResponseWithJSDate,
  convertTrackThumbnailResponse,
} from "utils/journey_types";

const EMPTY_TRACKS_THUMBNAIL: TrackThumbnailResponseWithJSDate[] = [];
export function useRetrieveTracksThumbnail(
  macAddress: string,
  startTime: DateTime,
  endTime: DateTime
) {
  const { setNotificationData } = useContext(NotificationContext);
  const query = useQuery(
    [
      "tracksThumbnail",
      {
        start_time: formatDateTime(startTime),
        end_time: formatDateTime(endTime),
        mac_address: macAddress,
      },
    ],
    async () => {
      const trackResponse = (
        await JourneyService.retrieveTracksThumbnail({
          start_time: formatDateTime(startTime),
          end_time: formatDateTime(endTime),
          mac_address: macAddress,
        })
      ).map((response) => convertTrackThumbnailResponse(response));
      if (trackResponse.length === 0) {
        setNotificationData({
          message:
            "No journey results found for this search. Try picking another object or image",
          severity: "warning",
        });
      }
      return trackResponse;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      onError: (error) => {
        console.error("Error retrieving tracks thumbnail:", error);
        setNotificationData({
          message: "Something went wrong. Please try again later!",
          severity: "error",
        });
      },
    }
  );

  return {
    ...query,
    data: query.data || EMPTY_TRACKS_THUMBNAIL,
  };
}
