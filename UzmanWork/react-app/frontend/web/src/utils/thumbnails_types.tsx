import { ThumbnailResponse } from "coram-common-utils";
import { DateTime } from "luxon";

export interface ThumbnailResponseWithJSDate
  extends Omit<ThumbnailResponse, "timestamp"> {
  timestamp: DateTime;
}

export function convertThumbnailResponse(
  response: ThumbnailResponse
): ThumbnailResponseWithJSDate {
  return {
    ...response,
    timestamp: DateTime.fromISO(response.timestamp),
  };
}
