import { ThumbnailService } from "coram-common-utils";
import {
  VisiblePortion,
  timeFromRatio,
} from "components/zoom_free_timeline/utils";
import { TimeInterval } from "utils/time";
import { DateTime, Duration } from "luxon";
import pLimit from "p-limit";
import { useMemo } from "react";
import { QueryFunction, useQueries, useQuery } from "react-query";
import { findClosestIndex } from "utils/binary_search";
import { formatDateTime } from "utils/dates";
import {
  ThumbnailResponseWithJSDate,
  convertThumbnailResponse,
} from "utils/thumbnails_types";

// Maximum elapsed time between two thumbnails
const THUMBNAIL_MAX_INTERVAL_S = 60;
// Minimum elapsed time between two thumbnails
const THUMBNAIL_MIN_INTERVAL_S = 5;
// Number of thumbnails request to enqueue at a time
// NOTE(@lberg): The browser has a maximum number of request
// it can enqueue at a time. It starts cancelling requests
// if we go over that limit.
const LIMIT_THUMBNAILS_FETCH = pLimit(50);

// Limit the frequency at which we refresh the thumbnails
// If the end_time is in the future.
const LIMIT_END_TIME_REFRESH_MINUTES = 5;

// If we find a thumbnail in the initial fetch, but is
// more than this value away from the current time, we
// don't show it.
const MAX_INITIAL_THUMBNAIL_DIFFERENCE = Duration.fromObject({
  minutes: 30,
});

interface OptionalImageTimePair {
  image_url: string | undefined;
  time: DateTime;
}
export interface ImageTimePair extends OptionalImageTimePair {
  image_url: string;
}

interface ImageBlobTimePair {
  image_blob: Blob;
  time: DateTime;
}

const EMPTY_THUMBNAILS = new Map<string, ThumbnailResponseWithJSDate>();
// Fetch thumbnails for a given time range from the backend.
export function useThumbnails({
  cameraMacAddress,
  timeStart,
  timeEnd,
  maxNumImages,
  enabled = true,
}: {
  cameraMacAddress: string;
  timeStart: DateTime;
  timeEnd: DateTime;
  maxNumImages?: number;
  enabled?: boolean;
}) {
  const timeNow = DateTime.now().setZone(timeStart.zone);
  if (timeEnd > timeNow) {
    // Fetch up to the current time, with frequency limited
    timeEnd = timeNow.set({
      second: 0,
      millisecond: 0,
      minute:
        timeNow.minute - (timeNow.minute % LIMIT_END_TIME_REFRESH_MINUTES),
    });
  }

  // If the duration between start and end time is smaller than the max interval,
  // expand it to the max interval. This way, we will always fetch
  // at least one thumbnail.
  const duration = timeEnd.diff(timeStart).as("seconds");
  if (duration < THUMBNAIL_MAX_INTERVAL_S) {
    const timeMiddle = timeStart.plus({ seconds: duration / 2 });
    timeStart = timeMiddle.minus({ seconds: THUMBNAIL_MAX_INTERVAL_S / 2 });
    timeEnd = timeMiddle.plus({ seconds: THUMBNAIL_MAX_INTERVAL_S / 2 });
  }

  // Compute the maximum number of thumbnails we can fetch
  // in the given time interval based on the minimum interval
  // between two thumbnails.
  const numThumbnailsInInterval = Math.round(
    timeEnd.diff(timeStart).as("seconds") / THUMBNAIL_MIN_INTERVAL_S
  );
  const numThumbnailsToFetch = Math.min(
    numThumbnailsInInterval,
    maxNumImages ?? numThumbnailsInInterval
  );

  const query = useQuery(
    [
      "thumbnails",
      cameraMacAddress,
      formatDateTime(timeStart),
      formatDateTime(timeEnd),
      numThumbnailsToFetch,
    ],
    async () => {
      const thumbnail_record = await ThumbnailService.queryThumbnailsRange({
        camera_mac_address: cameraMacAddress,
        start_time: formatDateTime(timeStart),
        end_time: formatDateTime(timeEnd),
        max_num_images: numThumbnailsToFetch,
      });
      return new Map<string, ThumbnailResponseWithJSDate>(
        Object.entries(thumbnail_record).map(([key, value]) => [
          key,
          convertThumbnailResponse(value),
        ])
      );
    },
    {
      retry: 3,
      staleTime: Infinity,
      enabled: enabled,
    }
  );
  return {
    ...query,
    data: query.data ?? EMPTY_THUMBNAILS,
  };
}

// Return an array of image urls and times from the thumbnail response.
// Discard any thumbnails that are not available.
export function imageArrayFromThumbnailsResponse(
  response: Map<string, ThumbnailResponseWithJSDate>
): ImageTimePair[] {
  return Array.from(response.values()).map((resp) => ({
    image_url: resp.s3_signed_url,
    time: resp.timestamp,
  }));
}

// Fetch the thumbnails blob in parallel.
export function useFetchThumbnailsBlobs(thumbnails: ImageTimePair[]) {
  return useQueries(
    thumbnails.map((val) => ({
      queryKey: [val.image_url],
      queryFn: (async ({ signal }) => {
        return {
          image_blob: await LIMIT_THUMBNAILS_FETCH(async () => {
            const promise = await fetch(val.image_url, { signal });
            return promise.blob();
          }),
          time: val.time,
        } as ImageBlobTimePair;
      }) as QueryFunction<ImageBlobTimePair>,
      staleTime: Infinity,
      retry: false,
    }))
  );
}

// Flatten thumbnails in the response map to an array.
// For each one of them send a request to fetch the image blob.
// NOTE(@lberg): The list of blobs will be in the same order as the list of thumbnails but the blob will only
// be available for the thumbnails when they are fetched.
export function useThumbnailsAndBlobs(
  thumbnailResponseMap: Map<string, ThumbnailResponseWithJSDate>
) {
  const thumbnails = useMemo(() => {
    return imageArrayFromThumbnailsResponse(thumbnailResponseMap);
  }, [thumbnailResponseMap]);

  const thumbnailsBlobs = useFetchThumbnailsBlobs(thumbnails);

  return {
    thumbnails,
    thumbnailsBlobs,
  };
}

// Get the image blob and time pair closer to the given time.
// If the image is not available in the current thumbnails,
// fallback to the initial thumbnails if available.
export function getCurrentImageBlobTimePair(
  time: DateTime,
  currentThumbnails: ImageTimePair[],
  currentThumbnailsImages: (ImageBlobTimePair | undefined)[],
  initialThumbnails: ImageTimePair[],
  initialThumbnailsImages: (ImageBlobTimePair | undefined)[],
  maxInitialThumbnailDifference: Duration = MAX_INITIAL_THUMBNAIL_DIFFERENCE
) {
  let thumbnailImage = undefined;
  // Search in current thumbnails
  const currentThumbnailIndex = findClosestIndex(
    currentThumbnails.map((p) => p.time.toUnixInteger()),
    time.toUnixInteger()
  );
  thumbnailImage = currentThumbnailsImages.at(currentThumbnailIndex);

  // Optional fallback to initial thumbnails if provided
  if (
    thumbnailImage === undefined &&
    initialThumbnailsImages !== undefined &&
    initialThumbnails !== undefined
  ) {
    const initialThumbnailIndex = findClosestIndex(
      initialThumbnails.map((p) => p.time.toUnixInteger()),
      time.toUnixInteger()
    );
    thumbnailImage = initialThumbnailsImages.at(initialThumbnailIndex);

    // We might find a thumbnail which is too far from the current time.
    // In that case, we don't want to fallback to the initial thumbnails.
    if (
      thumbnailImage !== undefined &&
      Math.abs(thumbnailImage.time.diff(time).as("seconds")) >
        maxInitialThumbnailDifference.as("seconds")
    ) {
      thumbnailImage = undefined;
    }
  }
  return thumbnailImage;
}

export function useCurrentThumbnail({
  cameraMacAddress,
  timeInterval,
  visiblePortion,
  currentTime,
  numThumbsToFetchInitial,
  numThumbsToFetchVisible,
  waitForInitialThumbnails = false,
  maxInitialThumbnailDifference = MAX_INITIAL_THUMBNAIL_DIFFERENCE,
}: {
  cameraMacAddress: string;
  timeInterval: TimeInterval;
  visiblePortion: VisiblePortion;
  currentTime: DateTime;
  numThumbsToFetchInitial: number;
  numThumbsToFetchVisible: number;
  waitForInitialThumbnails?: boolean;
  maxInitialThumbnailDifference?: Duration;
}) {
  const {
    data: thumbnailResponseMapInitial,
    isFetched: isFetchedInitial,
    isError: isErrorInitial,
  } = useThumbnails({
    cameraMacAddress,
    timeStart: timeInterval.timeStart,
    timeEnd: timeInterval.timeEnd,
    maxNumImages: numThumbsToFetchInitial,
    enabled: timeInterval.timeStart.isValid && timeInterval.timeEnd.isValid,
  });

  const {
    thumbnails: initialThumbnails,
    thumbnailsBlobs: initialThumbnailsBlobs,
  } = useThumbnailsAndBlobs(thumbnailResponseMapInitial);
  const { data: thumbnailResponseMap, isError } = useThumbnails({
    cameraMacAddress,
    timeStart: timeFromRatio(visiblePortion.startRatio, timeInterval),
    timeEnd: timeFromRatio(visiblePortion.endRatio, timeInterval),
    maxNumImages: numThumbsToFetchVisible,
    enabled: waitForInitialThumbnails ? isFetchedInitial : true,
  });

  const { thumbnails, thumbnailsBlobs } =
    useThumbnailsAndBlobs(thumbnailResponseMap);

  const thumbnail = getCurrentImageBlobTimePair(
    currentTime,
    thumbnails,
    thumbnailsBlobs.map((r) => r.data),
    initialThumbnails,
    initialThumbnailsBlobs.map((r) => r.data),
    maxInitialThumbnailDifference
  );
  return {
    thumbnail,
    isError: isError && isErrorInitial,
    stillFetching: thumbnailsBlobs.some((r) => r.isFetching),
  };
}
