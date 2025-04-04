import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";
import {
  randomArchiveCommentResponses,
  randomArchivesSummary,
} from "stories/utils_stories";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const COMMENT_RESPONSES = randomArchiveCommentResponses(25);
const SUMMARY_RESPONSES = randomArchivesSummary(10);

const archive_handlers = {
  members: [
    rest.post(BASE + "/kinesis_api/clip", async (req, res, ctx) => {
      return res(ctx.text("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"));
    }),
    rest.post(BASE + "/monitor/video_stream_alert", async (req, res, ctx) => {
      return res(ctx.status(400));
    }),
    rest.get(`${BASE}/archive/:archive_id/comments`, async (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(COMMENT_RESPONSES));
    }),
  ],
  summary: [
    rest.get(BASE + "/archive/summary", async (req, res, ctx) => {
      return res(ctx.json(SUMMARY_RESPONSES));
    }),
  ],
};

export default archive_handlers;
