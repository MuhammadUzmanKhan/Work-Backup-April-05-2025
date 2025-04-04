import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";
import {
  CAMERAS,
  DASHBOARD_WITH_COUNTER_REPORT,
  DASHBOARD_WITH_NO_REPORTS,
} from "./consts";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

export const dashboardAPIMocks = {
  dashboards: [
    rest.get(
      `${BASE}/dashboard/${DASHBOARD_WITH_COUNTER_REPORT.id}`,
      (_, res, ctx) => {
        return res(ctx.json(DASHBOARD_WITH_COUNTER_REPORT));
      }
    ),
    rest.get(
      `${BASE}/dashboard/${DASHBOARD_WITH_NO_REPORTS.id}`,
      (_, res, ctx) => {
        return res(ctx.json(DASHBOARD_WITH_NO_REPORTS));
      }
    ),
  ],
  cameras: [
    rest.get(`${BASE}/cameras`, (req, res, ctx) => {
      return res(ctx.json(CAMERAS));
    }),
  ],
  thumbnail: [
    rest.post(
      BASE + "/thumbnail/query_thumbnails_timestamps",
      async (_, res, ctx) => {
        return res(ctx.json({}));
      }
    ),
  ],
};
