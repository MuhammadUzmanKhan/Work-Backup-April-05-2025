import { OpenAPI, TrackThumbnailResponse } from "coram-common-utils";
import { rest } from "msw";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

export function generateTracks(): TrackThumbnailResponse[] {
  const tracks: TrackThumbnailResponse[] = [];
  for (let i = 0; i < 10; i++) {
    tracks.push({
      thumbnail_data: {
        camera_mac_address: "",
        timestamp: "2021-10-01T00:00:00.000Z",
        track_id: i,
        perception_stack_start_id: "stack-start",
        s3_path: "",
      },
      signed_url:
        i % 2 == 0
          ? "https://via.placeholder.com/300x100"
          : "https://via.placeholder.com/100x300",
    });
  }
  return tracks;
}

const journey_handler = {
  journey: [
    rest.post(
      BASE + "/journey/retrieve_tracks_thumbnail",
      async (req, res, ctx) => {
        return res(ctx.json(generateTracks()));
      }
    ),
  ],
};

export default journey_handler;
