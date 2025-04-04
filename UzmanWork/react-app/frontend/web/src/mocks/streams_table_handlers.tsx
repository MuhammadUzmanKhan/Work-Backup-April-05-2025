import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const streams_table_handlers = {
  members: [
    rest.post(
      BASE + "/thumbnail/most_recent_thumbnails",
      async (req, res, ctx) => {
        return res(ctx.json({}));
      }
    ),
    rest.get(BASE + "/groups", async (req, res, ctx) => {
      return res(ctx.json([]));
    }),
    rest.get(BASE + "/features", async (req, res, ctx) => {
      return res(ctx.json([]));
    }),
  ],
};

export function camera_orientation_updater_handlers_factory(
  isSuccessful: boolean
) {
  return {
    members: [
      rest.post(
        BASE + "/devices/update_camera_video_orientation_type",
        async (req, res, ctx) => {
          await new Promise((r) => setTimeout(r, 2000));
          return res(ctx.status(isSuccessful ? 200 : 400));
        }
      ),
    ],
  };
}

export const camera_rtsp_updater_handler = {
  members: [
    rest.post(
      BASE + "/devices/update_camera_rtsp_url",
      async (req, res, ctx) => {
        await new Promise((r) => setTimeout(r, 2000));
        return res(ctx.status(200));
      }
    ),
  ],
};

export default streams_table_handlers;
