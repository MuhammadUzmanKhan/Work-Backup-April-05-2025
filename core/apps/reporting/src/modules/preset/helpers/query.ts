import { Sequelize } from 'sequelize-typescript';

export const userRole = (companyId: number) =>
  Sequelize.literal(`(
    SELECT
    CASE
      WHEN "ucr"."role_id" = 0 THEN 0
      WHEN "ucr"."role_id" = 28 THEN 28
      ELSE "roles"."id"
    END AS "name"
    FROM "roles"
    INNER JOIN "users_companies_roles" AS "ucr" ON "roles".id = "ucr"."role_id"
    WHERE "ucr"."user_id" = "Preset"."user_id"
    AND (
      "ucr"."role_id" IN (0, 28)
      OR "ucr"."company_id" = ${companyId}
    )
  )`);
