import { Location, OpenAPI } from "coram-common-utils";
import { rest } from "msw";
import { randomLocations } from "stories/utils_stories";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const LOCATIONS = randomLocations(10);

const location_handlers = {
  locations: [
    rest.get(`${BASE}/locations`, (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([...LOCATIONS.values()] as Location[])
      );
    }),
    rest.get(`${BASE}/groups_with_location`, (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json([
          {
            name: "Group 1",
            location_ids: [1],
            id: 1,
          },
        ])
      );
    }),
  ],
};

export default location_handlers;
