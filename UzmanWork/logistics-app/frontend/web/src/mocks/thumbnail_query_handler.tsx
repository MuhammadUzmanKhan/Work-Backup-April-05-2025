import { OpenAPI, ThumbnailResponse } from "coram-common-utils";
import { DateTime } from "luxon";
import { rest } from "msw";
import { formatDateTime } from "utils/dates";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

// generated with https://png-pixel.com/
const IMAGES = [
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAYAAAC3kr3rAAAA9ElEQVR42u3TMQEAAAgDINc/9Czg7wMdyLQd4BRBQBAQBAQBQUAQEAQEAUFAEEAQEAQEAUFAEBAEBAFBQBAQRBAQBAQBQUAQEAQEAUFAEBAEEAQEAUFAEBAEBAFBQBAQBAQBBAFBQBAQBAQBQUAQEAQEAQQBQUAQEAQEAUFAEBAEBAFBAEFAEBAEBAFBQBAQBAQBQQBBQBAQBAQBQUAQEAQEAUFAEEAQEAQEAUFAEBAEBAFBQBAQRBAQBAQBQUAQEAQEAUFAEBAEEAQEAUFAEBAEBAFBQBAQBAQRBAQBQUAQEAQEAUFAEBAEBAEEAUFAEBAEPizvSmcgLoaUHAAAAABJRU5ErkJggg==",
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAYAAAC3kr3rAAAA9klEQVR42u3TMQEAAAgDIM1n/zyzgL8PdKAnlQJOLQgIAoKAICAICAKCgCAgCAgCCAKCgCAgCAgCgoAgIAgIAoIIAoKAICAICAKCgCAgCAgCggCCgCAgCAgCgoAgIAgIAoKAIIAgIAgIAoKAICAICAKCgCCAICAICAKCgCAgCAgCgoAgIAggCAgCgoAgIAgIAoKAICAIIAgIAoKAICAICAKCgCAgCAgCCAKCgCAgCAgCgoAgIAgIAoIIAoKAICAICAKCgCAgCAgCggCCgCAgCAgCgoAgIAgIAoKAIIKAICAICAKCgCAgCAgCgoAggCAgCAgCgsCHBXQQEsDLJcTBAAAAAElFTkSuQmCC",
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAYAAAC3kr3rAAAA+ElEQVR42u3TMQEAMAgAoNlomS1nDC3g7wMdiMrfD1iFICAICAKCgCAgCAgCgoAgIAggCAgCgoAgIAgIAoKAICAICCIICAKCgCAgCAgCgoAgIAgIAggCgoAgIAgIAoKAICAICAKCAIKAICAICAKCgCAgCAgCggCCgCAgCAgCgoAgIAgIAoKAIIAgIAgIAoKAICAICAKCgCCAICAICAKCgCAgCAgCgoAgIAggCAgCgoAgIAgIAoKAICAICCIICAKCgCAgCAgCgoAgIAgIAggCgoAgIAgIAoKAICAICAKCCAKCgCAgCAgCgoAgIAgIAoIAgoAgIAgIAhcG9DlGyNdBWCsAAAAASUVORK5CYII=",
  "iVBORw0KGgoAAAANSUhEUgAAAMgAAAB4CAYAAAC3kr3rAAAA+UlEQVR42u3TMQ0AMAgAsOFo/vWQIAMM8PO0Hhr1sx+wCkFAEBAEBAFBQBAQBAQBQUAQQBAQBAQBQUAQEAQEAUFAEBBEEBAEBAFBQBAQBAQBQUAQEAQQBAQBQUAQEAQEAUFAEBAEBAEEAUFAEBAEBAFBQBAQBAQBBAFBQBAQBAQBQUAQEAQEAUEAQUAQEAQEAUFAEBAEBAFBAEFAEBAEBAFBQBAQBAQBQUAQQBAQBAQBQUAQEAQEAUFAEBBEEBAEBAFBQBAQBAQBQUAQEAQQBAQBQUAQEAQEAUFAEBAEBBEEBAFBQBAQBAQBQUAQEAQEAQQBQUAQEAQuDCfvZbittnOFAAAAAElFTkSuQmCC",
];

async function b64toBlob(base64: string, type = "application/octet-stream") {
  return await (await fetch(`data:${type};base64,${base64}`)).blob();
}

async function generateMockThumbnails(startTime: DateTime, endTime: DateTime) {
  const data: ThumbnailResponse[] = [];
  let curTime = startTime;
  while (curTime < endTime) {
    const rndColorIdx = Math.floor(Math.random() * IMAGES.length);
    const blob = await b64toBlob(IMAGES[rndColorIdx]);
    data.push({
      timestamp: formatDateTime(curTime),
      s3_path: "",
      s3_signed_url: URL.createObjectURL(blob),
    });
    curTime = curTime.plus({ seconds: 10 });
  }
  return data;
}

const thumbnail_query_handler = {
  thumbnail_query: [
    rest.post(BASE + "/thumbnail/query_thumbnails", async (req, res, ctx) => {
      const json = await req.json();
      const startTime = DateTime.fromISO(json["start_time"]);
      const endTime = DateTime.fromISO(json["end_time"]);
      const data = await generateMockThumbnails(startTime, endTime);
      return res(ctx.json(Object.fromEntries(data.map((d) => [d]))));
    }),
  ],
};

export default thumbnail_query_handler;
