import { ForbiddenException, HttpException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Op } from "sequelize";
import * as moment from "moment";

import { Users } from "../../common/models/users.model";
import { AuthenticateUserDto } from "./dto/authenticate.dto";
import FirebaseService from "src/common/firebase/firebase.service";
import { Settings } from "src/common/models/settings.model";
import { Sessions } from "src/common/models/sessions.model";
import { Workspaces } from "src/common/models/workspaces.model";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { accountsMessages, authMessages, invitationsMessages } from "src/common/constants/messages";
import { Subscriptions } from "src/common/models/subscription.model";
import { PaymentPlans } from "src/common/models/payment-plans.model";
import { PaymentRequiredException } from "src/common/helpers";
import { OnboardingStep } from "src/common/models/onboarding-steps.model";
import { ROLES } from "src/common/constants/roles";
import { PAYMENT_REQUIRED_ALL, PAYMENT_REQUIRED_OWNER, USER_NOT_FOUND } from "src/common/constants/exceptions";

// Define whitelisted routes
const whitelistedRoutes = ['/payments', '/stripe', '/user', '/auth', '/workspaces'];

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly integrationService: IntegrationsServiceHubspot,
  ) { }

  public async authenticateUser(data: AuthenticateUserDto, req: Request) {
    let newUser: boolean = false
    try {
      const {
        user: {
          firebase: { sign_in_provider },
        },
        additionalInformation: { uid, email, displayName },
      } = await FirebaseService.decodeIdToken(data.idToken);


      let user: Users = await Users.findOne({
        where: { email },
        include: [
          {
            model: Settings,
          },
          {
            model: Workspaces,
            attributes: ['id'],
            include: [
              {
                model: Settings
              },
              {
                model: Subscriptions,
                attributes: ['isActive', 'allowedUsers']
              }
            ],
            order: [['createdAt', 'DESC']]
          },
        ],
        paranoid: false
      })

      if (user) {
        if (user.deletedAt) {
          throw new ForbiddenException(invitationsMessages.memberAlreadyExistInDifferentWorkspace);
        }
      }

      if (!user) {
        const phoneNumber = user?.phoneNumber ?? null;
        const { isNewUser, user: createdUser } = await this.createUser({ email, name: displayName, provider: sign_in_provider, uid, phoneNumber: phoneNumber, });
        newUser = isNewUser
        user = createdUser
      }
      console.log("🚀 ~ AuthService ~ authenticateUser ~ user:", user)

      if (!newUser) {
        const source = req.headers.source
        await this.checkUserSubscription(user.id, null, '' + source)
      }

      user.provider = sign_in_provider

      const session = await Sessions.create({ userId: user.id });
      const token = this.jwtService.sign(session.id);

      await user.save();
      await session.save();

      let settings: Settings = user.company?.settings;
      if (!settings) {
        if (user.companyId) settings = await Settings.create({ companyId: user.companyId, userId: user.id });
      }

      if (!user.onBoardingCompleted) {
        const onboarding = await OnboardingStep.findOne({ where: { userId: user.id } });
        if (!onboarding) {
          await OnboardingStep.create({ userId: user.id });
        }
      }

      const filteredUser = {
        id: user.id,
        uid: user.uid,
        name: user.name,
        role: user.role,
        email: user.email,
        phoneNumber: user?.phoneNumber ?? null,
        companyId: user.companyId,
        upworkTarget: user.upworkTarget,
        linkedinTarget: user.linkedinTarget,
        onBoardingCompleted: user.onBoardingCompleted,
        newUser,
        settings: user.settings,
        company: {
          settings,
          subscription: user.company?.subscription
        }
      };
      console.log("🚀 ~ AuthService ~ authenticateUser ~ filteredUser:", filteredUser)
      return {
        message: authMessages.userAuthenticated,
        token,
        user: filteredUser,
      };
    } catch (e: any) {
      console.log(e);
      if (e instanceof HttpException) throw e
      throw new UnauthorizedException(
        authMessages.userNotAuthenticated,
      );
    }
  }

  async createUser({ uid, email, name, phoneNumber, provider }: { uid: string, email: string, provider: string, name: string, phoneNumber: string }): Promise<{ user: Users; isNewUser: boolean }> {
    console.log("🚀 ~ AuthService ~ createUser ~ phoneNumber:", phoneNumber)
    const user = await Users.create({
      uid,
      email,
      provider,
      name,
      phoneNumber
    })
    const isNewUser = true

    let fullName = user.name;
    let lastSpaceIndex = fullName.lastIndexOf(' ');
    let firstName = fullName.substring(0, lastSpaceIndex);
    let lastName = fullName.substring(lastSpaceIndex + 1);

    this.integrationService.createAdminHubspotEntities({
      firstname: firstName,
      lastname: lastName,
      email: user.email,
      source: "Workspace",
      phoneNumber: user?.phoneNumber ?? null,
    })
    return { user, isNewUser }
  }

  public async signIn(data: AuthenticateUserDto) {
    try {
      const {
        additionalInformation: { email },
      } = await FirebaseService.decodeIdToken(data.idToken);

      const user = await Users.findOne({
        where: { email },
        include: [
          {
            model: Settings,
          },
          {
            model: Workspaces,
            attributes: ['id'],
            include: [Settings]
          },
        ],
      })

      if (!user) throw new NotFoundException('User Not Found!')

      await this.checkUserSubscription(user.id, null, 'Extension')

      const session = await Sessions.create({ userId: user.id });
      const token = this.jwtService.sign(session.id);

      await user.save();
      await session.save();

      let settings: Settings = user.company?.settings;
      if (!settings) {
        if (user.companyId) settings = await Settings.create({ companyId: user.companyId, userId: user.id });
      }

      const filteredUser = {
        id: user.id,
        uid: user.uid,
        name: user.name,
        role: user.role,
        email: user.email,
        phoneNumber: user?.phoneNumber ?? null,
        companyId: user.companyId,
        upworkTarget: user.upworkTarget,
        linkedinTarget: user.linkedinTarget,
        onBoardingCompleted: user.onBoardingCompleted,
        settings: user.settings,
        company: {
          settings,
        }
      };

      return {
        message: authMessages.userAuthenticated,
        token,
        user: filteredUser,
      };
    } catch (e) {
      console.error(authMessages.userAuthenticationError, e);
      if (e instanceof HttpException) throw e
      throw new UnauthorizedException(
        authMessages.userNotAuthenticated,
      );
    }
  }

  public async checkUserInDb(email: string): Promise<{ userExists: boolean, message: string }> {
    const user = await Users.findOne({
      where: {
        email,
        role: {
          [Op.ne]: ROLES.SUPER_ADMIN
        },
        companyId: {
          [Op.ne]: null
        }
      },
      paranoid: false
    })

    if (!user) {
      return {
        userExists: false,
        message: ''

      }
    }

    const message =
      user && user.deletedAt ?
        invitationsMessages.memberAlreadyExistInDifferentWorkspace :
        accountsMessages.accountAlreadyExist

    return {
      userExists: !!user,
      message,
    }
  }

  public async revokeToken(userId: string) {
    await Sessions.destroy({
      where: {
        userId
      }
    })
  }

  public async revokeCompanyTokens(companyId: string) {
    const userIds = (await Users.findAll({ where: { companyId }, attributes: ['id'] })).map(user => user.id)
    await Sessions.destroy({
      where: {
        userId: userIds
      }
    });
  }

  public async isSessionValid(sessionId: string): Promise<Sessions> {
    return await Sessions.findOne({ where: { id: sessionId } });
  }

  public async getUserObject(userId: string) {
    return await Users.findOne({
      where: { id: userId },
      attributes: {
        exclude: ['password']
      }
    });
  }

  public async checkUserSubscription(userId: string, url?: string, source?: string) {
    const user = await Users.findOne({
      where: {
        id: userId
      },
      include: [{
        model: Workspaces,
        attributes: ['id'],
        include: [{
          model: Subscriptions,
          attributes: ['planId', 'trialEndDate', 'nextBillingDate', 'isActive', 'currentPeriodEnd'],
          include: [{
            model: PaymentPlans,
            attributes: ['isTrial']
          }]
        }]
      }]
    })

    if (!user) throw new NotFoundException(USER_NOT_FOUND)

    if (user.company?.subscription) {
      const { isActive, plan, trialEndDate, currentPeriodEnd } = user.company.subscription;

      // Check if subscription is inactive
      const isSubscriptionInactive = !isActive;

      // Check if trial plan has ended
      const isTrialExpired = plan.isTrial && trialEndDate && moment(trialEndDate).isBefore(moment());

      // Check if next billing date has passed
      const isBillingExpired = currentPeriodEnd && moment(currentPeriodEnd).isBefore(moment());

      if (isSubscriptionInactive || isTrialExpired || isBillingExpired) {
        // Mark the subscription as inactive
        await Subscriptions.update(
          { isActive: false },
          { where: { workspaceId: user.companyId } }
        );

        //  Bypass subscription check for whitelisted routes
        if (url) {
          // When `url` exists, both conditions must be true
          if (whitelistedRoutes.some((route) => url.startsWith(route)) && user.role === ROLES.OWNER) {
            return true;
          }
        } else {
          // When `url` does not exist, only allow the OWNERS
          if (!source || source !== 'Extension') {
            if (user.role === ROLES.OWNER) {
              return true;
            }
          }
        }

        // Throw exception indicating the subscription has expired
        throw new PaymentRequiredException(user.role === ROLES.OWNER ? PAYMENT_REQUIRED_OWNER : PAYMENT_REQUIRED_ALL);

      }
    }
  }

  public async updateLastActivityDate(user: Users) {
    await Users.update({ lastActivityDate: new Date() }, {
      where: {
        id: user.id
      }
    })
  }
}
