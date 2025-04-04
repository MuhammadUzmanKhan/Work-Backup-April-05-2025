import { OpenAPI } from "coram-common-utils";
import { rest } from "msw";
import { randomOrganizations } from "stories/utils_stories";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const ORGS = randomOrganizations(10);

let ORG_NUMBER_LICENSED_CAMERAS: number | null = 10;

const organization_handler = {
  organizations: [
    rest.get(BASE + "/organizations", async (req, res, ctx) => {
      return res(ctx.json(Array.from(ORGS.values())));
    }),
    rest.post(
      BASE + "/organizations/update_always_on_retention",
      async (req, res, ctx) => {
        const json = await req.json();
        const retentionHours = Number(json["retention_hours"]);
        const orgId = Number(json["org_id"]);
        const org = ORGS.get(orgId);
        if (org) {
          org.retention_hours_always_on_streams = retentionHours;
        }

        return res(ctx.status(200));
      }
    ),
    rest.post(
      BASE + "/organizations/update_low_res_bitrate",
      async (req, res, ctx) => {
        const json = await req.json();
        const lowResBitrateKbps = Number(json["low_res_bitrate_kbps"]);
        const orgId = Number(json["org_id"]);
        const org = ORGS.get(orgId);
        if (org) {
          org.low_res_bitrate_kbps = lowResBitrateKbps;
        }

        return res(ctx.status(200));
      }
    ),

    rest.post(
      BASE + "/organizations/update_number_licensed_cameras",
      async (req, res, ctx) => {
        const json = await req.json();
        const numberLicensedCameras = Number(json["number_licensed_cameras"]);
        ORG_NUMBER_LICENSED_CAMERAS = numberLicensedCameras;
        return res(ctx.status(200));
      }
    ),
    rest.get(
      BASE + "/organizations/retrieve_number_licensed_cameras",
      async (req, res, ctx) => {
        return res(
          ctx.json({ number_licensed_cameras: ORG_NUMBER_LICENSED_CAMERAS })
        );
      }
    ),
  ],
};

export default organization_handler;
