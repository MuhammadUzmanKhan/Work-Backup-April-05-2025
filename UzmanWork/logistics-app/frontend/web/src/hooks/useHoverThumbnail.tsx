import { timeFromRatio } from "components/zoom_free_timeline/utils";
import {
  getCurrentImageBlobTimePair,
  imageArrayFromThumbnailsResponse,
  useFetchThumbnailsBlobs,
  useThumbnailsAndBlobs,
} from "hooks/thumbnail_fetcher";
import { DateTime } from "luxon";
import { ThumbnailResponseWithJSDate } from "utils/thumbnails_types";

export function useHoverThumbnail(
  thumbnailsData: Map<string, ThumbnailResponseWithJSDate>,
  startTime: DateTime,
  endTime: DateTime,
  mouseIsHover: boolean,
  hoverRatio: number,
  previewThumbnail: ThumbnailResponseWithJSDate | undefined
) {
  const { thumbnails, thumbnailsBlobs } = useThumbnailsAndBlobs(thumbnailsData);

  const thumbnailTime = timeFromRatio(hoverRatio, {
    timeStart: startTime,
    timeEnd: endTime,
  });

  const previewThumbnailImageLink = imageArrayFromThumbnailsResponse(
    previewThumbnail ? new Map([["", previewThumbnail]]) : new Map()
  );
  const previewThumbnailImageBlob = useFetchThumbnailsBlobs(
    previewThumbnailImageLink
  );

  if (!mouseIsHover) {
    return previewThumbnailImageBlob.at(0)?.data;
  }

  const thumbnail = getCurrentImageBlobTimePair(
    thumbnailTime,
    thumbnails,
    thumbnailsBlobs.map((r) => r.data),
    previewThumbnailImageLink,
    previewThumbnailImageBlob.map((r) => r.data)
  );

  return thumbnail;
}
