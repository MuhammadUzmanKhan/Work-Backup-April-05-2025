import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";
import {
  randomNVRDevicesResponse,
  randomCameraResponses,
} from "../stories/utils_stories";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const devices_page_handlers = {
  groups: [
    rest.get(`${BASE}/cameras`, (req, res, ctx) => {
      return res(ctx.json(randomCameraResponses(300)));
    }),

    rest.post(
      BASE + "/thumbnail/most_recent_thumbnails",
      async (req, res, ctx) => {
        return res(ctx.json({}));
      }
    ),
    rest.get(`${BASE}/groups`, (req, res, ctx) => {
      return res(
        ctx.json([
          {
            name: "Test 3",
            id: 75,
          },
          {
            name: "Hello",
            id: 80,
          },
        ])
      );
    }),
    rest.get(BASE + "/devices/nvrs", (req, res, ctx) => {
      const nvrDevices = randomNVRDevicesResponse(10);
      return res(ctx.json(nvrDevices));
    }),

    rest.post(BASE + "/devices/cameras_export", async (req, res, ctx) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return res(ctx.json({}));
    }),
  ],
};

export default devices_page_handlers;
