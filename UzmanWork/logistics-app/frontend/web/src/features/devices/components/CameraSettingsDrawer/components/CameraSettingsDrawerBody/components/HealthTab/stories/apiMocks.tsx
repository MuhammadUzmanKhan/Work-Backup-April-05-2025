import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";
import {
  CAMERA_DOWNTIME_RESPONSE,
  CAMERAS,
  NO_CAMERA_DOWNTIMES,
  OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE,
  OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE,
  ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE,
} from "./consts";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

export const apiMocks = {
  cameras: [
    rest.get(`${BASE}/cameras`, (req, res, ctx) => {
      return res(ctx.json(CAMERAS));
    }),
    rest.get(
      `${BASE}/cameras/downtime/${OFFLINE_CAMERA_WITH_DOWNTIME_RESPONSE.camera.id}`,
      (_, res, ctx) => {
        return res(ctx.json(CAMERA_DOWNTIME_RESPONSE));
      }
    ),
    rest.get(
      `${BASE}/cameras/downtime/${OFFLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.id}`,
      (_, res, ctx) => {
        return res(ctx.json(NO_CAMERA_DOWNTIMES));
      }
    ),
    rest.get(
      `${BASE}/cameras/downtime/${ONLINE_CAMERA_WITHOUT_DOWNTIME_RESPONSE.camera.id}`,
      (_, res, ctx) => {
        return res(ctx.json(NO_CAMERA_DOWNTIMES));
      }
    ),
  ],
};
