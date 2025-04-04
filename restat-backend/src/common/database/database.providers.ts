import { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import pg from "pg";
import { Sequelize } from "sequelize-typescript";
import { Workspaces } from "../models/workspaces.model";
import { Invitations } from "../models/invitations.model";
import { Themes } from "../models/themes.model";
import { ThemesService } from "src/modules/themes/themes.service";
import { Categories } from "../models/categories.model";
import { CategoriesService } from "src/modules/categories/categories.service";
import { UsersProfile } from "../models/users-profile.model";
import { UsersProfileCategories } from "../models/users-profile-categories.model";
import { Users } from "../models/users.model";
import { Bids } from "../models/bids.model";
import { JobsTags } from "../models/jobs-tags.model";
import { Jobs } from "../models/jobs.model";
import { Tags } from "../models/tags.model";
import { Accounts } from "../models/accounts.model";
import { Links } from "../models/links.model";
import { Portfolios } from "../models/portfolios.model";
import { PortfoliosTags } from "../models/portfolios-tags.model";
import { Profiles } from "../models/profiles.model";
import { Industries } from "../models/industries.model";
import { LinkedinAccountsData } from "../models/linkedin-account-data.model";
import { Education } from "../models/education.model";
import { Institutions } from "../models/institutions.model";
import { Skills } from "../models/skills.model";
import { LinkedinAccountSkills } from "../models/linkedin-account-skills.model";
import { Experience } from "../models/experience.model";
import { LinkedinAccountCompanies } from "../models/linkedin-account-companies.model";
import { Errors } from "../models/errors.model";
import { Integrations } from "../models/integrations.model";
import { Settings } from "../models/settings.model";
import { UserTargetHistory } from "../models/user-target-history.model";
import { StripeSubscriptions } from "../models/stripe-subscription.model"
import { StripeUserSubscriptions } from "../models/stripe-user-subscription.model";
import { StripeProrationLogs } from "../models/stripe-proration-logs.model";
import { StripeBillings } from "../models/stripe-billing.model";
import { Sessions } from "../models/sessions.model";
import { DealLogs } from "../models/deal-logs.model";
import { OtpVerification } from "../models/otp-verification.model";
import { RoleService } from "src/super-admin-modules/role/role.service";
import { Configurations } from "../models/configurations.model";
import { ConfigurationsService } from "src/super-admin-modules/configurations/configurations.service";
import { Comments } from "../models/comments.model";
import { Contacts } from "../models/contacts.model";
import { LinkedinReferences } from "../models/linkedin-reference";
import { Companies } from "../models/companies.model";
import { ContactSkills } from "../models/contact-skills.model";
import { ContactEducation } from "../models/contact-education.model";
import { ContactExperience } from "../models/contact-experience.model";
import { Notifications } from "../models/notifications.model";
import { WorkspaceDeletion } from "../models/workspace-deletion.model";
import { ExtensionReleasesModal } from "../models/extension-releases.model";

export const databaseProviders: Provider[] = [
  {
    provide: "SEQUELIZE",
    useFactory: async (
      configService: ConfigService,
      themesService: ThemesService,
      categoriesService: CategoriesService,
      roleService: RoleService,
    ) => {
      const sequelize = new Sequelize({
        dialect: "postgres",
        host: configService.get("DB_HOST"),
        port: configService.get("DB_PORT"),
        username: configService.get("DB_USERNAME"),
        password: configService.get("DB_PASSWORD"),
        database: configService.get("DB_DATABASE"),
        dialectModule: pg,
        dialectOptions: +configService.get("SSL") ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        } : {},
      });
      sequelize.addModels([
        Users,
        Workspaces,
        WorkspaceDeletion,
        Invitations,
        Profiles,
        UsersProfile,
        Themes,
        Categories,
        UsersProfileCategories,
        Accounts,
        Contacts,
        ContactSkills,
        ContactEducation,
        ContactExperience,
        Companies,
        LinkedinReferences,
        Bids,
        JobsTags,
        Jobs,
        Tags,
        Portfolios,
        PortfoliosTags,
        Links,
        Industries,
        LinkedinAccountsData,
        Education,
        Institutions,
        Skills,
        LinkedinAccountSkills,
        Experience,
        LinkedinAccountCompanies,
        Errors,
        Integrations,
        Settings,
        UserTargetHistory,
        StripeSubscriptions,
        StripeUserSubscriptions,
        StripeProrationLogs,
        StripeBillings,
        Sessions,
        DealLogs,
        OtpVerification,
        Configurations,
        Comments,
        Notifications,
        ExtensionReleasesModal,
      ]);
      if (!!Number(configService.get("SYNC_DATABASE"))) {
        await sequelize.sync({ alter: true, force: false });

        //add default themes
        await themesService.createPresetThemes();

        //add default catagories
        await categoriesService.createPresetCategories();

        //create super user
        await roleService.createSuperUser();

        //create Global configurations
        const configurationsService = new ConfigurationsService()
        await configurationsService.createGlobalConfiguration();

      }
      return sequelize;
    },
    inject: [ConfigService, ThemesService, CategoriesService, RoleService],
  },
];
