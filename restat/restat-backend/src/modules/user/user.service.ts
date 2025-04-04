import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from "@nestjs/common";
import { Users } from "src/common/models/users.model";
import { UpdateNameDto } from "./dto/update-name.dto";
import { EXCEPTIONS } from "src/common/constants/exceptions";
import { ROLES } from "src/common/constants/roles";
import { AddUserProfileDto } from "./dto/add-user-profile.dto";
import { UsersProfile } from "src/common/models/users-profile.model";
import { UsersProfileCategories } from "src/common/models/users-profile-categories.model";
import { Themes } from "src/common/models/themes.model";
import { Categories } from "src/common/models/categories.model";
import { UpdateUserCompanyDto } from "./dto/update-user-compnay.dto";
import { UpdateUserRoleDto } from "./dto/update-user-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { Invitations } from "src/common/models/invitations.model";
import { INVITATION_STATUS } from "src/common/constants/status";
import { Op } from "sequelize";
import { UserTargetHistory } from "src/common/models/user-target-history.model";
import { SOURCE } from "src/common/constants/source";
import * as moment from "moment";
import { USERSTATUS } from "src/common/constants/userStatus";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { BidService } from "../bids/bids.service";
import { ContactService } from "../contacts/contacts.service";
import { authMessages, companiesMessages, usersMessages } from "src/common/constants/messages";
import FirebaseService from "src/common/firebase/firebase.service";

@Injectable()
export class UserService {
  constructor(
    private readonly bidService: BidService,
    private readonly contactService: ContactService,
  ) { }

  public async getUserById(id: string) {
    return await Users.findByPk(id);
  }

  public async getAllUsers() {
    return await Users.findAll();
  }

  public async getCompanyUsers(companyId: string, page: number, perPage: number = 20) {
    try {
      const usersPerPage = perPage;
      const offset = (page - 1) * usersPerPage;
      const options: any = {
        where: { companyId },
        offset,
        order: [['createdAt', 'DESC']],
        limit: usersPerPage,
      };

      const companyUsers = await Users.findAll(options);

      let usersCount = await Users.count({
        where: options.where,
      });
      return {
        message: usersMessages.getCompanyUsers,
        page,
        users: companyUsers,
        usersPerPage,
        usersCount,
      };
    } catch (err) {
      console.error(usersMessages.getCompanyUsersError, err);
      throw new InternalServerErrorException(usersMessages.getCompanyUsersError + " internal server error");
    }
  }

  public async getPendingInvites(companyId: string, page: number) {
    try {
      const usersPerPage = 20;
      const offset = (page - 1) * usersPerPage;
      const options: any = {
        where: { companyId, status: INVITATION_STATUS.PENDING },
        order: [['createdAt', 'DESC']],
        offset,
        limit: usersPerPage,
      };

      const users = await Invitations.findAll(options);
      let usersCount = await Invitations.count({
        where: options.where,
      });

      return {
        message: usersMessages.pendingInvitesFetched,
        users,
        usersPerPage,
        usersCount,
      };
    } catch (err) {
      console.error(usersMessages.pendingInvitesFetchedError, err);
      throw new InternalServerErrorException(
        usersMessages.pendingInvitesFetchedError + " internal server error"
      );
    }
  }

  public async getAllCompanyUsers(companyId: string) {
    try {
      const users = await Users.findAll({
        where: {
          companyId, role: {
            [Op.in]: [ROLES.BIDDER, ROLES.COMPANY_ADMIN, ROLES.OWNER]
          }
        },
        attributes: ['id', 'name', 'companyId'],
        order: [['name', 'ASC']]
      });

      return {
        message: usersMessages.getCompanyUsers,
        users,
      };
    } catch (err) {
      console.error(usersMessages.getCompanyUsersError, err);
      throw new InternalServerErrorException(
        usersMessages.getCompanyUsersError + " internal server error"
      );
    }
  }

  public async getAllCompanyUserIds(companyId: string) {
    try {
      const userIDs = await Users.findAll({
        attributes: ["id"],
        where: { companyId },
      });

      return {
        message: usersMessages.getCompanyUsersById,
        userIds: userIDs.map((user) => user.id),
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        usersMessages.getCompanyUsersByIdError + " internal server error"
      );
    }
  }

  public async countAllCompanyUsers(companyId: string) {
    try {
      let usersCount = await Users.count({
        where: { companyId, status: USERSTATUS.ACTIVE }
      });
      return {
        message: usersMessages.countAllcompanyUsers,
        usersCount
      }
    } catch (err) {
      console.error(usersMessages.countAllcompanyUsersError, err);
      throw new InternalServerErrorException(
        usersMessages.countAllcompanyUsersError + " internal server error"
      );
    }
  }

  public async deleteUser(userId: string) {
    const user = await Users.findByPk(userId);

    if (!user) throw new NotFoundException(authMessages.userNotFound);


    if (user.role === ROLES.OWNER) throw new ConflictException(companiesMessages.companyOwnerCannotBeDeleted);
    user.linkedinTarget = '0'
    user.upworkTarget = '0'
    await UserTargetHistory.update({ validTo: moment() }, { where: { userId: user.id, validTo: null } })
    await user.save()
    const firebaseUser = await FirebaseService.getUserByEmail(user.email)
    if (!!firebaseUser) await FirebaseService.deleteFirebaseUserByEmail(user.email)
    await user.destroy();
    return {
      success: true,
      message: usersMessages.userDeleted
    };
  }

  public async addUserProile(
    userId: string,
    userProfileDto: AddUserProfileDto
  ) {
    const alreadyUserExists = await UsersProfile.findOne({
      where: { userId },
    });

    if (alreadyUserExists) throw new ConflictException(usersMessages.userAlreadyExists);

    try {
      const userProfile = await UsersProfile.create({
        location: userProfileDto.location,
        colorThemeId: userProfileDto.colorThemeId,
        userId,
      });

      await userProfile.assignUsersProfileCategories({
        categories: userProfileDto.categories,
      });

      const user = await UsersProfile.findByPk(userProfile.id, {
        include: [
          { model: Themes, required: true },
          {
            model: UsersProfileCategories,
            required: true,
            attributes: ["id"],
            include: [
              { model: Categories, required: true, attributes: ["id", "name"] },
            ],
          },
        ],
      });

      return {
        message: usersMessages.userAdded,
        user
      };
    } catch (error) {
      console.error(usersMessages.userAddError, error);
      return { messge: usersMessages.userAddError };
    }
  }

  public async updateName(id: string, updateNameDto: UpdateNameDto) {
    const user = await Users.findByPk(id);
    user.name = updateNameDto.name;
    await user.save();
    return { message: usersMessages.userNameUpdated };
  }

  public async updateUserCompany(updateUserCompanyDto: UpdateUserCompanyDto) {
    const user = await Users.findByPk(updateUserCompanyDto.id);
    if (updateUserCompanyDto.companyId) {
      user.companyId = updateUserCompanyDto.companyId;
    }
    await user.save();
    return { message: usersMessages.userProfileUpdated };
  }

  public async updateUserRole(updateUserRoleDto: UpdateUserRoleDto) {
    const user = await Users.findByPk(updateUserRoleDto.id);

    if (!user) throw new NotFoundException(authMessages.userNotFound);

    if (user.role === ROLES.OWNER) throw new ConflictException(EXCEPTIONS.COMPANY_OWNER_CANNOT_BE_UPDATED);

    user.role = updateUserRoleDto.role;
    await user.save();
    return { message: usersMessages.userRoleUpdated };
  }

  public async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const user = await Users.findByPk(id);

    if (!user) throw new NotFoundException("User not found");

    if (user.role === ROLES.OWNER) throw new ConflictException(EXCEPTIONS.COMPANY_OWNER_CANNOT_BE_UPDATED);

    user.status = updateStatusDto.status;
    await user.save();
    return { message: usersMessages.userStatusUpdated };
  }

  public async updateUser(updateUserDto: UpdateUserDto) {

    const user = await Users.findByPk(updateUserDto.id);

    if (!user) throw new NotFoundException(authMessages.userNotFound);

    if (user.role === ROLES.OWNER) throw new ConflictException(companiesMessages.companyOwnerCannotBeDeleted);

    try {
      await Users.update(
        {
          ...user,
          name: updateUserDto.name,
          role: updateUserDto.role,
          upworkTarget: updateUserDto.upworkTarget,
          linkedinTarget: updateUserDto.linkedinTarget,
        },
        {
          where: {
            id: updateUserDto.id,
          },
        }
      );

      if (+user.upworkTarget !== updateUserDto.upworkTarget) {
        await UserTargetHistory.update({ validTo: moment().subtract(1, 'month') }, { where: { userId: user.id, type: SOURCE.UPWORK, validTo: null } })
        let validFrom = new Date()
        if (!await UserTargetHistory.findOne({ where: { userId: user.id, type: SOURCE.UPWORK } })) {
          validFrom = user.createdAt
        }
        await UserTargetHistory.create({
          userId: user.id,
          type: SOURCE.UPWORK,
          target: updateUserDto.upworkTarget,
          validFrom,
          validTo: null,
        })
      }

      if (+user.linkedinTarget !== updateUserDto.linkedinTarget) {
        await UserTargetHistory.update({ validTo: moment().subtract(1, 'month') }, { where: { userId: user.id, type: SOURCE.LINKEDIN, validTo: null } })
        let validFrom = new Date()
        if (!await UserTargetHistory.findOne({ where: { userId: user.id, type: SOURCE.LINKEDIN } })) {
          validFrom = user.createdAt
        }
        await UserTargetHistory.create({
          userId: user.id,
          type: SOURCE.LINKEDIN,
          target: updateUserDto.linkedinTarget,
          validFrom,
          validTo: null,
        })
      }


      return { message: usersMessages.userUpdated };
    } catch (err) {
      console.error(usersMessages.userUpdateError, err);
      throw new InternalServerErrorException(
        usersMessages.userUpdateError + " internal server error"
      );
    }
  }

  public async createUser(companyId: string, createUserDto: CreateUserDto) {
    const { name, role, email } = createUserDto;
    const userAlreadyExists = await Users.findOne({ where: { email, companyId } })
    if (userAlreadyExists) {
      throw new ConflictException(usersMessages.userAlreadyExists)
    }
    try {
      const user = await Users.create({
        name,
        email,
        role,
        companyId
      })
      return {
        message: usersMessages.userCreated,
        user
      }
    } catch (err) {
      console.error(usersMessages.userCreateError, err)
      throw new InternalServerErrorException(usersMessages.userCreateError + " internal server error")
    }
  }

  public async getGoalCount({ userId, type, monthStart, dayStart, dayEnd }: { userId: string, type: SOURCE, monthStart?: string, dayStart?: string, dayEnd?: string }) {
    if (type === SOURCE.UPWORK) {
      return await this.bidService.countBids(userId, monthStart, dayStart, dayEnd)
    } else if (type === SOURCE.LINKEDIN) {
      return await this.contactService.countLinkedInConnections(userId, monthStart, dayStart, dayEnd)
    } else throw new NotAcceptableException(usersMessages.userGoalCountError)
  }

}
