import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";
import { generateRandomNotificationGroups } from "stories/utils_stories";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const NUM_NOTIFICATION_GROUPS = 3;

const NOTIFICATION_GROUPS = {
  notification_groups: generateRandomNotificationGroups(
    NUM_NOTIFICATION_GROUPS
  ),
};

export const notification_group_handlers = {
  notification_groups: [
    rest.post(
      `${BASE}/license_plate_alert/update_notification_groups/:alert_profile_id`,
      (req, res, ctx) => {
        return res(ctx.status(200));
      }
    ),
    rest.get(`${BASE}/notification_group`, (req, res, ctx) => {
      return res(ctx.status(200), ctx.json(NOTIFICATION_GROUPS));
    }),
  ],
};
