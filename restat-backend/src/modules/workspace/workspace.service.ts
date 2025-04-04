import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  OnModuleInit,
} from "@nestjs/common";
import { Workspaces } from "src/common/models/workspaces.model";
import { Users } from "src/common/models/users.model";
import { CreateWorkspaceDto } from "./dto/create-workspace.dto";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { AssociatedId } from "src/types/enum";
import { UpdateWorkspaceDto } from "./dto/update-workspace.dto";
import { NotFoundException } from '@nestjs/common';
import { companiesMessages } from "src/common/constants/messages";
import { WorkspaceDeletion } from "src/common/models/workspace-deletion.model";
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Op } from "sequelize";
import { LinkedinReferences } from "src/common/models/linkedin-reference";
import { OtpVerification } from "src/common/models/otp-verification.model";
import { Sessions } from "src/common/models/sessions.model";
import { Settings } from "src/common/models/settings.model";
import { StripeBillings } from "src/common/models/stripe-billing.model";
import { StripeUserSubscriptions } from "src/common/models/stripe-user-subscription.model";
import { LinkedinAccountsData } from "src/common/models/linkedin-account-data.model";
import { DealLogs } from "src/common/models/deal-logs.model";
import { Integrations } from "src/common/models/integrations.model";
import { UserTargetHistory } from "src/common/models/user-target-history.model";
import { UsersProfile } from "src/common/models/users-profile.model";
import { Contacts } from "src/common/models/contacts.model";
import { Industries } from "src/common/models/industries.model";
import { JobsTags } from "src/common/models/jobs-tags.model";
import { Links } from "src/common/models/links.model";
import { Tags } from "src/common/models/tags.model";
import { Configurations } from "src/common/models/configurations.model";
import { ContactExperience } from "src/common/models/contact-experience.model";
import { Invitations } from "src/common/models/invitations.model";
import { Portfolios } from "src/common/models/portfolios.model";
import { Profiles } from "src/common/models/profiles.model";
import { Comments } from "src/common/models/comments.model";
import { StripeSubscriptions } from "src/common/models/stripe-subscription.model";
import { Bids } from "src/common/models/bids.model";
import { PortfoliosTags } from "src/common/models/portfolios-tags.model";
import { LinkedinAccountSkills } from "src/common/models/linkedin-account-skills.model";
import { Education } from "src/common/models/education.model";
import { Experience } from "src/common/models/experience.model";
import { Companies } from "src/common/models/companies.model";
import { ContactEducation } from "src/common/models/contact-education.model";
import { ContactSkills } from "src/common/models/contact-skills.model";
import { StripeProrationLogs } from "src/common/models/stripe-proration-logs.model";
import { UsersProfileCategories } from "src/common/models/users-profile-categories.model";
import { MailService } from "../mail/mail.service";
import { Errors } from "src/common/models/errors.model";
import { ROLES } from "src/common/constants/roles";
import FirebaseService from "src/common/firebase/firebase.service";
import { ConfigService } from "@nestjs/config";
import { CronJob } from "cron";


@Injectable()
export class WorkspaceService implements OnModuleInit {
  constructor(
    private readonly integrationService: IntegrationsServiceHubspot,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.cronExpression = this.configService.get('APP_MODE') === 'prod'
      ? CronExpression.EVERY_DAY_AT_MIDNIGHT
      : CronExpression.EVERY_10_MINUTES;
  }

  private cronExpression: string;

  async onModuleInit() {
    const jobName = 'deleteExpiredWorkspaces';

    // Check if the job already exists
    if (this.schedulerRegistry.doesExist('cron', jobName)) {
      console.warn(`Cron Job with the name '${jobName}' already exists. Skipping registration.`);
      return;
    }

    const job: any = new CronJob(this.cronExpression, async () => {
      await this.deleteExpiredWorkspaces();
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();

    console.info(`Cron Job '${jobName}' successfully registered with expression: ${this.cronExpression}`);
  }

  public async deleteExpiredWorkspaces() {
    const currentDate = new Date();

    const currentISODate = currentDate.toISOString();

    const expiredDeletions = await WorkspaceDeletion.findAll({
      where: { deletionDate: { [Op.lte]: currentISODate } }
    });

    console.info(`Found ${expiredDeletions.length} workspaces scheduled for deletion`);

    for (const deletion of expiredDeletions) {
      try {
        await this.deleteWorkspaceAssociations(deletion.workspaceId)

        console.info(`Workspace ${deletion.workspaceId} deleted successfully at ${new Date()}`);
      } catch (error) {
        console.error(`Failed to delete workspace ${deletion.workspaceId}:`, error);
      }
    }
  }

  public async createCompany(
    userId: string,
    createWorkspaceDto: CreateWorkspaceDto
  ) {
    const user = await Users.findOne({
      where: { id: userId, companyId: null },
    });
    if (!user) throw new ConflictException(companiesMessages.companyAlreadyExists);

    if (createWorkspaceDto.websiteUrl) {
      let companyAlreadyExists = await Workspaces.findOne({
        where: { websiteUrl: createWorkspaceDto.websiteUrl },
      });
      if (companyAlreadyExists) {
        throw new ConflictException(companiesMessages.companyAlreadyExists);
      }
    }

    const company = await Workspaces.create({
      name: createWorkspaceDto.name,
      websiteUrl: createWorkspaceDto.websiteUrl,
      logoUrl: createWorkspaceDto.logoUrl,
      companySize: createWorkspaceDto.companySize,
      ownerId: userId,
      phoneNumber: createWorkspaceDto.phoneNumber,
      colorThemeId: createWorkspaceDto.colorThemeId,
      categories: createWorkspaceDto.categories,
      location: createWorkspaceDto.location
    });
    if (!company) throw new InternalServerErrorException(companiesMessages.companyNotFound);

    user.companyId = company.id;
    user.save();

    if (!user.hubspotContactId) {
      let fullName = user.name;
      let lastSpaceIndex = fullName.lastIndexOf(' ');
      let firstName = fullName.substring(0, lastSpaceIndex);
      let lastName = fullName.substring(lastSpaceIndex + 1);
      await this.integrationService.createAdminHubspotEntities({
        firstname: firstName,
        lastname: lastName,
        email: user.email,
        source: "Workspace"
      })
    }

    await this.integrationService.createAdminHubspotEntities({
      name: company.name
    },
      {
        type: AssociatedId.CONTACT,
        id: user.hubspotContactId
      }
    )
    return {
      message: companiesMessages.companyCreated,
      company: company,
      user: user,
    };
  }

  public async getCompanyById(id: string) {
    return await Workspaces.findByPk(id, {
      attributes: ['id', 'name', 'websiteUrl', 'phoneNumber', 'logoUrl', 'companySize', 'location']
    });
  }

  public async getAllWorkspaces() {
    return await Workspaces.findAll();
  }

  public async updateWorkspace(
    companyId: string,
    updateWorkspaceDto: UpdateWorkspaceDto
  ) {

    const company = await Workspaces.findOne({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException(companiesMessages.companyNotFound);
    }

    const { ...updatableFields } = updateWorkspaceDto;
    Object.assign(company, updatableFields);

    const updatedCompany = await company.save();
    if (!updatedCompany) {
      throw new InternalServerErrorException(companiesMessages.companyUpdateError);
    }


    return {
      message: companiesMessages.companyUpdated,
      company: updatedCompany,
    };
  }

  public async requestWorkspaceDeletionOtp(user: Users) {
    try {
      const expirationMinutes = '10';
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + parseInt(expirationMinutes) * 60 * 1000);

      const existingOtp = await OtpVerification.findOne({
        where: { userId: user.id, isVerified: false },
      });

      const userCompany = await Workspaces.findOne({ where: { id: user.companyId } });

      if (!userCompany) throw new NotFoundException(companiesMessages.companyNotFound);

      if (existingOtp) await existingOtp.destroy();

      await OtpVerification.create({
        userId: user.id,
        otp,
        otpExpiresAt,
      });

      await this.mailService.sendOtpForDeletionVerification(user.name, user.email, userCompany.name, otp, expirationMinutes);

      return { message: "OTP sent for workspace deletion" };

    } catch (error) {
      console.error("Failed to send OTP for workspace deletion:", error);
      throw new InternalServerErrorException("Failed to send OTP for workspace deletion");
    }
  }

  public async deleteWorkspace({ user, otp }: { user: Users, otp: { otp: string } }) {
    try {
      const otpRecord = await OtpVerification.findOne({
        where: {
          otp: otp.otp,
          otpExpiresAt: {
            [Op.gt]: Date.now()
          },
          userId: user.id,
          isVerified: false,
        },
      });

      if (!otpRecord) {
        throw new ConflictException("Invalid or expired OTP");
      }

      // Mark OTP as verified
      otpRecord.isVerified = true;
      await otpRecord.save();

      const superAdmins = await Users.findAll({
        where: { role: ROLES.SUPER_ADMIN },
      });

      const company = await Workspaces.findOne({ where: { id: user.companyId } });

      if (!company) {
        throw new NotFoundException(companiesMessages.companyNotFound);
      }

      if (company.ownerId !== user.id) {
        throw new ConflictException(companiesMessages.onlyOwnerCanDeleteWorkspace);
      }

      const deletionDate = new Date();

      if (this.configService.get('APP_MODE') === 'prod') {
        deletionDate.setHours(0, 0, 0, 0);
        deletionDate.setDate(deletionDate.getDate() + 30);
      } else {
        deletionDate.setSeconds(0, 0)
        deletionDate.setMinutes(deletionDate.getMinutes() + 10);
      }
      
      const deletion = await WorkspaceDeletion.create({
        workspaceId: user.companyId,
        deletionDate,
      });

      console.info(`Scheduling workspace ${user.companyId} for deletion at ${deletionDate}`);

      await this.mailService.confirmationForWorkspaceDeletion({
        name: user.name,
        email: user.email,
        superAdminEmails: superAdmins.map(admin => admin.email),
        workspaceName: company.name,
        otp: otp.otp,
        expirationTime: '10 minutes',
        initiationDate: new Date().toLocaleString(),
        scheduledDeletionDate: deletionDate.toLocaleString()
      });

      await this.mailService.sendWorkSpaceDeletionToSuperAdmins({
        name: user.name,
        email: user.email,
        superAdminEmails: superAdmins.map(admin => admin.email),
        workspaceName: company.name,
        initiationDate: new Date().toLocaleString(),
        scheduledDeletionDate: deletionDate.toLocaleString()
      });

      return {
        message: companiesMessages.deleteWorkspaceScheduled,
        deletedWorkspace: deletion
      };
    } catch (error) {
      console.error(error)
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(companiesMessages.deleteWorkspaceError);
    }
  }

  public async getWorkspaceDeletionDate(user: Users) {
    const deletion = await WorkspaceDeletion.findOne({ where: { workspaceId: user.companyId } });
    if (!deletion) {
      throw new NotFoundException(companiesMessages.companyNotFound);
    }

    return {
      message: companiesMessages.companyByIdFetched,
      deletedWorkspace: deletion,
    };
  }

  public async deleteWorkspaceDeletion(workspaceId: string) {
    const deletion = await WorkspaceDeletion.findOne({ where: { workspaceId } });
    if (!deletion) {
      throw new NotFoundException(companiesMessages.companyNotFound);
    }

    await WorkspaceDeletion.destroy({ where: { workspaceId }, force: true });

    return {
      message: companiesMessages.deleteWorkspaceScheduled,
    };
  }

  private async deleteWorkspaceAssociations(workspaceId: string) {
    try {
      await this.deleteContactAssocations(workspaceId);
      await this.deletePortfoliosAssociations(workspaceId);
      await this.deleteStripSubscriptionsAssociations(workspaceId);
      await this.deleteUserAssociations(workspaceId);
      await this.deleteDirectWorkspaceAssociations(workspaceId);
      await this.deleteWorkspaceRecord(workspaceId);
      console.info(`Successfully deleted all associations and workspace for workspaceId ${workspaceId}.`);
    } catch (error) {

      console.error("Error deleting workspace associations:", error);
      throw error;
    }
  };

  private async deleteUserAssociations(workspaceId: string,) {
    const users = await Users.findAll({
      where: { companyId: workspaceId }
    });

    const userIds = users.map(user => user.id);

    if (userIds.length === 0) {
      console.info(`No users found for workspaceId ${workspaceId}.`);
      return;
    }

    await Workspaces.update(
      { ownerId: null },
      {
        where: { ownerId: { [Op.in]: userIds } },
      }
    );

    await this.deleteBidAssociations(userIds);
    await this.deleteLinkedinAccountAssociations(userIds);
    await this.deleteLinkedinAccountsDataAssociations(userIds);
    await this.deleteUsersProfileAssociations(userIds);

    const userModels: any[] = [
      Bids, Comments, Integrations, LinkedinAccountsData,
      LinkedinReferences, OtpVerification, Sessions, Settings,
      StripeUserSubscriptions, UsersProfile, UserTargetHistory, Errors,
    ];

    await Promise.all(
      userModels.map(model =>
        model.destroy({
          where: { userId: { [Op.in]: userIds } },
          force: true
        })
      )
    );

    await Promise.all(
      users.map(async (user) => {
        try {
          await FirebaseService.deleteFirebaseUserByEmail(user.email);
          console.info(`Firebase user deleted for email ${user.email}.`);
        } catch (error) {
          console.error(`Failed to delete Firebase user for email ${user.email}:`, error);
        }
      }))

    console.info(`User associations deleted for workspaceId ${workspaceId}.`);
  }

  private async deleteBidAssociations(userIds: string[]) {
    const bids = await Bids.findAll({
      where: { userId: { [Op.in]: userIds } },
    });
    const bidIds = bids.map(bid => bid.id);

    if (bidIds.length === 0) {
      console.info(`No bids found for userIds ${userIds}.`);
      return;
    }

    await Promise.all([
      Comments.destroy({
        where: { bidId: { [Op.in]: bidIds } },
        force: true
      }),
      DealLogs.destroy({
        where: { bidId: { [Op.in]: bidIds } },
        force: true
      })
    ]);

    console.info(`Cascading bid associations deleted for userIds ${userIds}.`);
  }

  private async deleteContactAssocations(workspaceId: string) {
    const contacts = await Contacts.findAll({
      where: { workspaceId }
    })

    const contactIds = contacts.map(contact => contact.id).filter(id => id !== null);

    if (contactIds.length === 0) {
      console.info(`No contacts found for workspaceId ${workspaceId}.`);
      return;
    }

    await Promise.all([
      ContactEducation.destroy({
        where: { contactId: { [Op.in]: contactIds } },
        force: true
      }),
      DealLogs.destroy({
        where: { contactId: { [Op.in]: contactIds } },
        force: true
      }),
      ContactSkills.destroy({
        where: { contactId: { [Op.in]: contactIds } },
        force: true
      }),
      ContactExperience.destroy({
        where: { contactId: { [Op.in]: contactIds } },
        force: true
      })
    ]);

  }

  private async deleteUsersProfileAssociations(userIds: string[]) {
    const usersProfiles = await UsersProfile.findAll({
      where: { userId: { [Op.in]: userIds } }
    });

    const usersProfileIds = usersProfiles.map(profile => profile.id).filter(id => id !== null);

    if (usersProfileIds.length === 0) {
      console.info(`No users profiles found for userIds ${userIds}.`);
      return;
    }

    await Promise.all([
      UsersProfileCategories.destroy({
        where: { profileId: { [Op.in]: usersProfileIds } },
        force: true
      }),
    ]);

    console.info(`Users profile associations deleted for userIds ${userIds}.`);
  }

  private async deleteLinkedinAccountAssociations(userIds: string[]) {
    const linkedinAccounts = await LinkedinAccountsData.findAll({
      where: { userId: { [Op.in]: userIds } },
    });
    const linkedinAccountIds = linkedinAccounts.map(acc => acc.id).filter(id => id !== null);

    if (linkedinAccountIds.length === 0) {
      console.info(`No LinkedIn accounts found for userIds ${userIds}.`);
      return;
    }
    // Delete skills, education, and experience related to LinkedIn accounts
    await Promise.all([
      LinkedinAccountSkills.destroy({
        where: { linkedinAccountId: { [Op.in]: linkedinAccountIds } },
        force: true
      }),
      Education.destroy({
        where: { linkedinAccountId: { [Op.in]: linkedinAccountIds } },
        force: true
      }),
      Experience.destroy({
        where: { linkedinAccountId: { [Op.in]: linkedinAccountIds } },
        force: true
      })
    ]);

    console.info(`LinkedIn account associations deleted for userIds ${userIds}.`);
  }

  private async deleteStripSubscriptionsAssociations(companyId: string) {
    const subscriptions = await StripeSubscriptions.findAll({
      where: { companyId }
    });

    const subscriptionIds = subscriptions.map(subscription => subscription.id).filter(id => id !== null);

    if (subscriptionIds.length === 0) {
      console.info(`No Stripe subscriptions found for companyId ${companyId}.`);
      return;
    }

    await Promise.all([
      StripeProrationLogs.destroy({
        where: { operationId: { [Op.in]: subscriptionIds } },
        force: true
      })
    ]);

    console.info(`Stripe subscription associations deleted for companyId ${companyId}.`);
  }

  private async deletePortfoliosAssociations(companyId: string) {
    const portfolios = await Portfolios.findAll({
      where: { companyId },
    });

    console.info({ portfolios }, 'portfolios');
    const portfoliosId = portfolios.map(portfolio => portfolio.id).filter(id => id !== null);

    if (portfoliosId.length === 0) {
      console.info(`No portfolios found for companyId ${companyId}.`);
      return;
    }

    await Promise.all([
      Links.destroy({
        where: { portfolioId: { [Op.in]: portfoliosId } },
        force: true
      }),
      PortfoliosTags.destroy({
        where: { portfolioId: { [Op.in]: portfoliosId } },
        force: true
      }),
    ]);

    console.info(`Profile associations deleted for companyId ${companyId}.`);
  }

  private async deleteLinkedinAccountsDataAssociations(userIds: string[]) {
    const linkedinAccountsData = await LinkedinAccountsData.findAll({
      where: { userId: { [Op.in]: userIds } },
    });

    const linkedinAccountIds = linkedinAccountsData.map(acc => acc.id).filter(id => id !== null);

    if (linkedinAccountIds.length === 0) {
      console.info(`No LinkedIn accounts data found for userIds ${userIds}.`);
      return;
    }

    await Promise.all([
      LinkedinAccountSkills.destroy({
        where: { linkedinAccountId: { [Op.in]: linkedinAccountIds } },
        force: true
      }),
      Education.destroy({
        where: { linkedinAccountId: { [Op.in]: linkedinAccountIds } },
        force: true
      }),
      Experience.destroy({
        where: { linkedinAccountId: { [Op.in]: linkedinAccountIds } },
        force: true
      })
    ]);

    console.info(`LinkedIn account data associations deleted for userIds ${userIds}.`);
  }

  private async deleteDirectWorkspaceAssociations(workspaceId: string) {
    const workspaceIdModel: any[] = [
      JobsTags, Contacts, Industries, Tags, Links,
      WorkspaceDeletion, Integrations, Companies,
    ];

    const companyIdModels: any[] = [
      Configurations, ContactExperience, Invitations,
      Portfolios, Profiles, Settings, StripeBillings,
      StripeSubscriptions, Users,
    ];

    for (const model of workspaceIdModel) {
      await model.destroy({
        where: { workspaceId },
        force: true
      },
      );
    }

    for (const model of companyIdModels) {
      await model.destroy({
        where: { companyId: workspaceId },
        force: true
      });
    }

    console.info(`Direct associations deleted for workspaceId/companyId ${workspaceId}.`);
  };

  private async deleteWorkspaceRecord(workspaceId: string) {
    await Workspaces.destroy({
      where: { id: workspaceId },
      force: true
    });

    console.info(`Workspace deleted for workspaceId ${workspaceId}.`);
  }

}
