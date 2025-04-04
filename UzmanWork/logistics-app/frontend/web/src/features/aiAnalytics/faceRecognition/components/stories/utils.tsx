import { UniqueFaceResponse, OpenAPI } from "coram-common-utils";
import { DateTime } from "luxon";
import { rest } from "msw";

export const UNIQUE_FACE_RESPONSE: UniqueFaceResponse = {
  org_unique_face_id: 1,
  s3_path: "https://placehold.co/200x200?text=Face",
  occurrence_time: DateTime.local().toISO(),
  mac_address: "00:00:00:00:00:00",
  s3_signed_url: "https://placehold.co/200x200?text=Face",
};

const BASE = "http://msw";
OpenAPI.BASE = BASE;

export const handlers = {
  registerAlertProfile: [
    rest.post(
      BASE + "/face_alert/register_alert_profile",
      async (req, res, ctx) => {
        // simulate slow network
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return res(ctx.status(200));
      }
    ),
  ],
};
