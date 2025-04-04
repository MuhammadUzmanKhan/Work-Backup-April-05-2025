/*
 Navicat Premium Data Transfer

 Source Server         : 161.35.28.53_5432
 Source Server Type    : PostgreSQL
 Source Server Version : 130009
 Source Host           : 161.35.28.53:5432
 Source Catalog        : restat-staging
 Source Schema         : public

 Target Server Type    : PostgreSQL
 Target Server Version : 130009
 File Encoding         : 65001

 Date: 04/02/2024 18:13:27
*/


-- ----------------------------
-- Add a unique constraint on the "name" column for table "industries"
-- ----------------------------
ALTER TABLE "public"."industries"
ADD CONSTRAINT "industries_name_key" UNIQUE (name);

-- ----------------------------
-- Add a unique constraint on the "name" column for table "institutions"
-- ----------------------------
ALTER TABLE "public"."institutions"
ADD CONSTRAINT "institutions_name_key" UNIQUE (name);


-- ----------------------------
-- Add a unique constraint on the "url" column for table "jobs"
-- ----------------------------
ALTER TABLE "public"."jobs"
ADD CONSTRAINT "jobs_url_key" UNIQUE (url);

-- ----------------------------
-- Add a unique constraint on the "name" and "location" column for table linkedin-account-companies
-- ----------------------------
ALTER TABLE "public"."linkedin-account-companies"
ADD CONSTRAINT "linkedin-account-companies_name_location_key" UNIQUE (name, location);
-- ----------------------------
-- Add a unique constraint on the "name" column for table skills
-- ----------------------------
ALTER TABLE "public"."skills"
ADD CONSTRAINT "skills_name_key" UNIQUE (name);

-- ----------------------------
-- Drop the existing unique constraint for table education
-- ----------------------------
ALTER TABLE "public"."education"
DROP CONSTRAINT IF EXISTS "education_linkedinAccountId_institutionId_key";

-- Add the new unique constraint with the "degree" column
ALTER TABLE "public"."education"
ADD CONSTRAINT "education_linkedinAccountId_institutionId_degree_key" UNIQUE ("linkedinAccountId", "institutionId", "degree");

-- ----------------------------
-- Drop the existing unique constraint for table experience
-- ----------------------------
ALTER TABLE "public"."experience"
DROP CONSTRAINT IF EXISTS "experience_linkedinAccountId_linkedinAccountCompanyId_key";

-- Add the new unique constraint with "title" and "duration" columns
ALTER TABLE "public"."experience"
ADD CONSTRAINT "experience_linkedinAccountId_linkedinAccountCompanyId_title_duration_key" UNIQUE ("linkedinAccountId", "linkedinAccountCompanyId", "title", "duration");

ALTER TABLE "public"."bids"
ADD CONSTRAINT "unique_bid_profile_url_constraint" UNIQUE ("bidProfileId", "upworkProposalURL");


/// Updated DB ------------------------- >>><<< --------------------------
-- ----------------------------
-- Add a unique constraint on the "name" and "location" column for table company
-- ----------------------------
ALTER TABLE "public"."company"
ADD CONSTRAINT "companies_name_location_key" UNIQUE (name, location);


-- ----------------------------
-- Drop the existing unique constraint for table contact-education
-- ----------------------------
ALTER TABLE "public"."contact-education"
DROP CONSTRAINT IF EXISTS "contact-education_contactId_institutionId_key";

-- Add the new unique constraint with the "degree" column
ALTER TABLE "public"."contact-education"
ADD CONSTRAINT "contact-education_contactId_institutionId_degree_key" UNIQUE ("contactId", "institutionId", "degree");

-- ----------------------------
-- Drop the existing unique constraint for table contact-experience
-- ----------------------------
ALTER TABLE "public"."contact-experience"
DROP CONSTRAINT IF EXISTS "contact-experience_contactId_companyId_key";

-- Add the new unique constraint with "title" and "duration" columns
ALTER TABLE "public"."contact-experience"
ADD CONSTRAINT "contact-experience_contactId_companyId_title_duration_key" UNIQUE ("contactId", "companyId", "title", "duration");


-- ----------------------------
-- Drop the existing unique constraint for table company
-- ----------------------------
ALTER TABLE "public"."company"
DROP CONSTRAINT IF EXISTS "companies_name_location_key";

-- Add the new unique constraint with "name", "location" and "workspaceId" columns
ALTER TABLE "public"."company"
ADD CONSTRAINT "companies_name_location_workspaceId_key" UNIQUE ("name", "location", "workspaceId");
