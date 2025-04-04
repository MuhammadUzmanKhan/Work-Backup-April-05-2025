import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

function getMockedHlsStream(path: string) {
  return rest.get(path, (req, res, ctx) => {
    return res(ctx.text("https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"));
  });
}

const video_player_handlers = {
  members: [
    getMockedHlsStream(BASE + "/shared_videos_public/exchange/*"),
    getMockedHlsStream(BASE + "/kinesis_api/clip"),
    getMockedHlsStream(BASE + "/kinesis_api/live"),
    getMockedHlsStream(BASE + "/kiosk_public/*/live_kiosk"),
  ],
};

export default video_player_handlers;
