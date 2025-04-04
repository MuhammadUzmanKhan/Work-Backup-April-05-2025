import { OpenAPI } from "coram-common-utils/src/backend_client";
import { rest } from "msw";
import { ARCHIVE_ID, COMMENTS } from "./consts";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

export const apiMocks = {
  cameras: [
    rest.get(`${BASE}/archive/${ARCHIVE_ID}/comments`, (_, res, ctx) => {
      return res(ctx.json(COMMENTS));
    }),
  ],
};
