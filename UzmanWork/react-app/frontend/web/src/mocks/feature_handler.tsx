import { FeatureFlags, OpenAPI } from "coram-common-utils";
import { rest } from "msw";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const feature_handler = {
  feature_flags: [
    rest.get(BASE + "/features", async (req, res, ctx) => {
      return res(ctx.json(Object.values(FeatureFlags)));
    }),
  ],
};

export default feature_handler;
