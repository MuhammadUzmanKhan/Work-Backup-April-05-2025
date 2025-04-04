import { HttpException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Users } from "../../common/models/users.model";
import FirebaseService from "src/common/firebase/firebase.service";
import { AuthenticateUserDto } from "./dto/authenticate.dto";
import { Settings } from "src/common/models/settings.model";
import { Sessions } from "src/common/models/sessions.model";
import { Workspaces } from "src/common/models/workspaces.model";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { authMessages } from "src/common/constants/messages";
import { Op } from "sequelize";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly integrationService: IntegrationsServiceHubspot,
  ) { }

  public async authenticateUser(data: AuthenticateUserDto) {
    let newUser: boolean = false
    try {
      const {
        user: {
          firebase: { sign_in_provider },
        },
        additionalInformation: { uid, email, displayName },
      } = await FirebaseService.decodeIdToken(data.idToken);

      const createUser = async (): Promise<Users> => {
        const user = await Users.create({
          uid,
          email,
          provider: sign_in_provider,
          name: displayName,
        })
        newUser = true

        let fullName = user.name;
        let lastSpaceIndex = fullName.lastIndexOf(' ');
        let firstName = fullName.substring(0, lastSpaceIndex);
        let lastName = fullName.substring(lastSpaceIndex + 1);

        this.integrationService.createAdminHubspotEntities({
          firstname: firstName,
          lastname: lastName,
          email: user.email,
          source: "Workspace"
        })
        return user
      }

      const user =
        (await Users.findOne({
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
        })) || await createUser();

      user.provider = sign_in_provider;
      

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
        companyId: user.companyId,
        upworkTarget: user.upworkTarget,
        linkedinTarget: user.linkedinTarget,
        newUser,
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
    } catch (e: any) {
      console.error(authMessages.userAuthenticationError, e);
      throw new UnauthorizedException(
        authMessages.userNotAuthenticated,
      );
    }
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

      if(!user) throw new NotFoundException('User Not Found!')

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
        companyId: user.companyId,
        upworkTarget: user.upworkTarget,
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
      if(e instanceof HttpException) throw e
      throw new UnauthorizedException(
        authMessages.userNotAuthenticated,
      );
    }
  }

  public async checkUserInDb(email: string): Promise<{ userExists: boolean }> {
    const users = await Users.findOne({
      where: { 
        email,
        role: {
          [Op.ne] : 'SUPER_ADMIN'
        },
        companyId: {
          [Op.ne]: null
        }
       },
    })
    return {
      userExists: users ? true : false
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

}
