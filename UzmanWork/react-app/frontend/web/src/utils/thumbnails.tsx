import { ThumbnailService } from "coram-common-utils";
import { DateTime } from "luxon";
import { convertThumbnailResponse } from "./thumbnails_types";
import { isDefined } from "./types";
import { formatDateTime } from "./dates";
import { ClipData } from "components/timeline/ClipsGrid";

interface TimestampRequest {
  macAddress: string;
  startTime: DateTime;
  endTime: DateTime;
}

const MIN_HALF_DURATION_S = 60;

export async function getClipsPreviewThumbnail(
  timestampRequests: TimestampRequest[]
) {
  return (
    await ThumbnailService.queryThumbnailsTimestamps(
      timestampRequests.map((req) => {
        const halfDurationS = req.endTime.diff(req.startTime).as("seconds") / 2;
        const timestamp = req.startTime.plus({
          seconds: halfDurationS,
        });
        const toleranceS = Math.max(halfDurationS, MIN_HALF_DURATION_S);
        return {
          mac_address: req.macAddress,
          timestamp: formatDateTime(timestamp),
          tolerance_s: toleranceS,
        };
      })
    )
  ).map((thumbnail) =>
    isDefined(thumbnail.response)
      ? convertThumbnailResponse(thumbnail.response)
      : undefined
  );
}

export async function augmentClipsWithThumbnails<T extends ClipData>(
  aggregatedClips: T[]
) {
  if (!aggregatedClips.some((clip) => !isDefined(clip.thumbnailData))) {
    return aggregatedClips;
  }

  // For clips where we don't have a local s3 signed url, fetch the normal
  // thumbnail.
  // Note that this downloads more thumbnails than we need, but it's
  // easier to implement since we need to have each thumbnail correspond to
  // a clip and they indices to match up.
  // TODO (balazs): We could make this more efficient by only querying
  // thumbnails for clips where we don't have a person s3 signed url, but since
  // we query only one thumbnail for each clip, it's not a big deal.
  const thumbnails = await getClipsPreviewThumbnail(
    aggregatedClips.map((clip) => ({
      macAddress: clip.camera.camera.mac_address,
      startTime: clip.startTime,
      endTime: clip.endTime,
    }))
  );

  return aggregatedClips.map((clip, index) =>
    isDefined(clip.thumbnailData)
      ? clip
      : { ...clip, thumbnailData: thumbnails[index] }
  );
}
