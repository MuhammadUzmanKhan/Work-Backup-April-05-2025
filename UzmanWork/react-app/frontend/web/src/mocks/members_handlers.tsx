import { OpenAPI, UserRole } from "coram-common-utils";
import { rest } from "msw";

const BASE = "http://msw";
OpenAPI.BASE = BASE;

const firstUser = {
  user_id: "user_1",
  email: "user_1@example.com",
  name: "User 1",
  role: UserRole.ADMIN,
  last_login: "2020-01-01T01:00:00Z",
};

const secondUser = {
  user_id: "user_2",
  email: "user_2@example.com",
  name: "User 2",
  role: UserRole.REGULAR,
};

let org_flag_state = true;

export const members_handlers = {
  members: [
    rest.get(BASE + "/members/list", (req, res, ctx) => {
      return res(ctx.json([firstUser, secondUser]));
    }),
    rest.post(BASE + "/members/create", async (req, res, ctx) => {
      await new Promise((r) => setTimeout(r, 2000));
      return res(ctx.json(firstUser));
    }),
  ],
  org_flag: [
    rest.get(BASE + "/members/get_org_flag", (req, res, ctx) => {
      return res(ctx.json(org_flag_state));
    }),
    rest.post(BASE + "/members/update_org_flag", async (req, res, ctx) => {
      const org_flag_body = await req.json();
      org_flag_state = org_flag_body.org_flag;
      return res(ctx.status(200), ctx.json({}));
    }),
  ],
};

export const org_flag_error_handlers = {
  org_flat: [
    rest.get(BASE + "/members/get_org_flag", (req, res, ctx) => {
      return res(ctx.json(org_flag_state));
    }),
    rest.post(BASE + "/members/update_org_flag", async (req, res, ctx) => {
      await new Promise((r) => setTimeout(r, 2000));
      return res(ctx.status(404), ctx.json({}));
    }),
  ],
};
