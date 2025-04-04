import { OpenAPI, SharedVideoResponse } from "coram-common-utils";
import { rest } from "msw";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const DEFAULT_SHARED_VIDEO_RESPONSE: SharedVideoResponse = {
  live_stream_name: "test",
  start_time: "2023-05-09T09_41_04-07_00",
  end_time: "2023-05-09T09_41_06-07_00",
  timezone: "America/Los_Angeles",
  camera_name: "test",
  mac_address: "test",
  is_audio_enabled: true,
};

export const video_page_not_found_handlers = {
  handlers: [
    rest.get(BASE + "/shared_videos_public/info/*", (req, res, ctx) => {
      return res(ctx.json(DEFAULT_SHARED_VIDEO_RESPONSE));
    }),
    rest.get(BASE + "/shared_videos_public/exchange/*", (req, res, ctx) => {
      return res(ctx.status(400));
    }),
    rest.get(BASE + "/shared_videos_public/download/*", (req, res, ctx) => {
      return res(ctx.status(400));
    }),
  ],
};

export const video_page_handlers = {
  handlers: [
    rest.get(BASE + "/shared_videos_public/info/*", (req, res, ctx) => {
      return res(ctx.json(DEFAULT_SHARED_VIDEO_RESPONSE));
    }),
    rest.get(BASE + "/shared_videos_public/exchange/*", (req, res, ctx) => {
      return res(ctx.text("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"));
    }),
    rest.get(BASE + "/shared_videos_public/download/*", (req, res, ctx) => {
      return res(ctx.status(400));
    }),
  ],
};
