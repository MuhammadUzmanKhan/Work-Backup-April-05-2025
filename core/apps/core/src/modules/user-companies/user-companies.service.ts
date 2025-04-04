import moment from 'moment';
import { CreateOptions, DestroyOptions, Op, UpdateOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Company,
  Department,
  DepartmentUsers,
  Region,
  User,
  UserCompanyRole,
  UserCompanyRoleRegion,
} from '@ontrack-tech-group/common/models';
import {
  CommentableTypes,
  Editor,
  ERRORS,
  PolymorphicType,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  ChangeLogService,
  CommunicationService,
} from '@ontrack-tech-group/common/services';
import {
  getCompanyScope,
  throwCatchError,
} from '@ontrack-tech-group/common/helpers';
import { _MESSAGES } from '@Common/constants';
import { addUserToInProgressEvent } from '@Common/helpers';
import {
  isCompanyDepartmentExist,
  getUserCompaniesByUserId,
  filterUsersCompanyDataForAdminAndGlobalAdmin,
  canUpdateUserCompany,
  disassociateUserFromPreviousCompanyEvents,
  creatUserCompanyValidation,
  isRegionsExist,
  associateRegions,
  disassociateUserFromCompanyDepartments,
  disassociateEventUserForOldDepartment,
} from './helpers';
import {
  AddCommentDto,
  CreateUserCompanyDto,
  UpdateUserCompanyDto,
  UserCompaniesChangeLogsDto,
  UserCompaniesQueryDto,
} from './dto';

@Injectable()
export class UserCompaniesService {
  constructor(
    private sequelize: Sequelize,
    private readonly changeLogService: ChangeLogService,
    private readonly communicationService: CommunicationService,
  ) {}

  async createUserCompany(
    createUserCompanyDto: CreateUserCompanyDto,
    user: User,
  ) {
    const {
      user_id,
      company_id,
      role_id,
      department_id,
      user_category,
      region_ids,
    } = createUserCompanyDto;

    // Before creating a user associated with a company, it is necessary to verify if the user has access rights to this company.
    await getCompanyScope(user, company_id);

    const regions = await creatUserCompanyValidation(
      user_id,
      company_id,
      department_id,
      region_ids,
      role_id,
      user,
    );

    let userCompany: UserCompanyRole = await UserCompanyRole.findOne({
      where: {
        user_id,
        company_id,
        role_id,
      },
    });

    const transaction = await this.sequelize.transaction();

    try {
      if (department_id) {
        // assigning a user to department
        await DepartmentUsers.create(
          {
            user_id,
            department_id,
          },
          {
            transaction,
            editor: { editor_id: user.id, editor_name: user.name },
          } as CreateOptions & { editor: Editor },
        );

        //add user to all inprogress events of department
        await addUserToInProgressEvent(
          department_id,
          user_id,
          company_id,
          transaction,
          { useMaster: true },
        );
      }

      if (!userCompany) {
        userCompany = await UserCompanyRole.create(
          {
            user_id,
            company_id,
            role_id,
            category: user_category,
          },
          {
            transaction,
            editor: { editor_id: user.id, editor_name: user.name }, // Custom field for hooks
          } as CreateOptions & { editor: Editor },
        );
      }

      if (regions?.length)
        await associateRegions(
          userCompany.id,
          regions,
          false,
          user,
          transaction,
        );

      // Commit the transaction, saving the changes to the database
      await transaction.commit();
    } catch (err) {
      // If an error occurs during the transaction, rollback the changes
      await transaction.rollback();
      throwCatchError(err);
    }

    return await getUserCompaniesByUserId(userCompany.id, { useMaster: true });
  }

  async addUserCompanyComment(addCommentDto: AddCommentDto, user: User) {
    const { user_id, text } = addCommentDto;

    if (text === '')
      throw new BadRequestException(ERRORS.COMMENT_CANNOT_BE_EMPTY);

    const _user = await User.findByPk(user_id, { attributes: ['id'] });
    if (!_user) throw new NotFoundException(RESPONSES.notFound('User'));

    const data = {
      text,
      commentable_type: CommentableTypes.USER_COMPANY_ROLE,
      commentable_id: user_id,
    };

    const createdComment = await this.communicationService.communication(
      data,
      'create-comment',
      user,
    );

    return createdComment;
  }

  async getAllUserCompanies(
    userCompaniesQuery: UserCompaniesQueryDto,
    user: User,
  ) {
    const { user_id } = userCompaniesQuery;

    return await UserCompanyRole.findAll({
      where: await filterUsersCompanyDataForAdminAndGlobalAdmin(user_id, user),
      attributes: [
        'id',
        'user_id',
        'blocked_at',
        'role_id',
        [UserCompanyRole.getUserRoleByKeyWeb, 'role'],
        [Sequelize.literal(`"UserCompanyRole"."category"`), 'user_category'], // Specify table name for 'category'
        [Sequelize.literal(`"user"."name"`), 'user_name'],
        [Sequelize.literal(`"company"."name"`), 'company_name'],
        [Sequelize.literal(`"company"."id"`), 'company_id'],
        [Sequelize.literal(`"user->department"."name"`), 'department_name'],
        [Sequelize.literal(`"user->department"."id"`), 'department_id'],
      ],
      include: [
        {
          model: Company,
          attributes: [],
        },
        {
          model: User,
          attributes: [],
          include: [
            {
              model: Department,
              attributes: [],
              where: {
                company_id: {
                  [Op.eq]: Sequelize.literal('"UserCompanyRole"."company_id"'),
                },
              },
              required: false,
            },
          ],
        },
        {
          model: UserCompanyRoleRegion,
          attributes: [
            'region_id',
            [Sequelize.literal(`"regions->region"."name"`), 'region_name'],
          ],
          include: [
            {
              model: Region,
              attributes: [],
            },
          ],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
    });
  }

  async getUserCompanyChangeLogs(
    userCompaniesChangeLogsDto: UserCompaniesChangeLogsDto,
  ) {
    const { user_id, page, page_size } = userCompaniesChangeLogsDto;

    const user = await User.findByPk(user_id);
    if (!user) throw new NotFoundException(RESPONSES.notFound('User'));

    // all change logs against event
    const changeLogs = await this.changeLogService.getChangeLogs({
      id: user_id,
      types: [PolymorphicType.USER_COMPANY_ROLE],
      page: page,
      page_size: page_size,
    });

    return {
      ...changeLogs,
      pagination: {
        total_count: changeLogs.pagination.total_count,
        total_pages: Math.max(changeLogs.pagination.total_pages),
      },
    };
  }

  async getUserCompanyComments(
    userCompaniesChangeLogsDto: UserCompaniesChangeLogsDto,
    currentUser: User,
  ) {
    const { user_id, page, page_size } = userCompaniesChangeLogsDto;

    const user = await User.findByPk(user_id);
    if (!user) throw new NotFoundException(RESPONSES.notFound('User'));

    const data = {
      id: user_id,
      type: PolymorphicType.USER_COMPANY_ROLE,
      page: page,
      page_size: page_size,
    };

    // all comments against event
    const comments = await this.communicationService.communication(
      data,
      'get-comment-list',
      currentUser,
    );

    return {
      ...comments,
      pagination: {
        total_count: comments.pagination.total_count,
        total_pages: Math.max(comments.pagination.total_pages),
      },
    };
  }

  async updateUserCompany(
    id: number,
    updateUserCompanyDto: UpdateUserCompanyDto,
    user: User,
  ) {
    const {
      company_id,
      role_id,
      department_id,
      user_id,
      user_category,
      region_ids,
    } = updateUserCompanyDto;
    let regions: Region[];
    let isDepartmentUserExist: DepartmentUsers;
    let oldDepartmentIds: number[];

    // if a Admin tries to update user associated company of Global Admin or Global Manager, throw an error dont have access
    await canUpdateUserCompany(user_id, company_id, user, role_id, region_ids);

    // check if regions exist or not
    if (region_ids?.length) regions = await isRegionsExist(region_ids);

    // Before creating a user associated with a company, it is necessary to verify if the user has access rights to this company.
    await getCompanyScope(user, company_id);

    const userCompany = await UserCompanyRole.findOne({
      where: { id, user_id },
    });
    if (!userCompany)
      throw new NotFoundException(RESPONSES.notFound('User Company'));

    if (department_id) {
      // validation of all required things are exist or not
      await isCompanyDepartmentExist(company_id, department_id);

      isDepartmentUserExist = await DepartmentUsers.findOne({
        where: { department_id, user_id },
      });

      const oldDepartmentUsers = await DepartmentUsers.findAll({
        where: { user_id },
        attributes: ['department_id'],
        include: [
          {
            model: Department,
            where: { company_id },
            attributes: [],
          },
        ],
      });

      oldDepartmentIds = oldDepartmentUsers.map(
        (oldDepartmentUser) => oldDepartmentUser.department_id,
      );
    }

    const oldCompanyId = userCompany.company_id;

    const transaction = await this.sequelize.transaction();

    try {
      await UserCompanyRole.update(
        { company_id, role_id, category: user_category },
        {
          where: { id: userCompany.id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name }, // Custom field for hooks
        } as UpdateOptions & {
          editor: Editor;
        },
      );

      if (department_id && !oldDepartmentIds.includes(department_id)) {
        // disassociate this user from all departments of this company
        await disassociateUserFromCompanyDepartments(
          oldCompanyId,
          user_id,
          user,
          department_id,
          transaction,
        );

        // remove event_user data for old departments
        await disassociateEventUserForOldDepartment(user_id, oldDepartmentIds);

        if (!isDepartmentUserExist) {
          // assigning a user to department
          await DepartmentUsers.create(
            {
              user_id,
              department_id,
            },
            {
              transaction,
              editor: { editor_id: user.id, editor_name: user.name },
            } as CreateOptions & { editor: Editor },
          );

          await addUserToInProgressEvent(
            department_id,
            user_id,
            company_id,
            transaction,
            { useMaster: true },
          );

          // disassociate this user from all events of previous company if changed.
          // disassociate this user from previous company department
          if (oldCompanyId !== company_id) {
            await disassociateUserFromPreviousCompanyEvents(
              oldCompanyId,
              user_id,
              transaction,
            );
          }
        }
      }

      if (regions?.length)
        await associateRegions(
          userCompany.id,
          regions,
          true,
          user,
          transaction,
        );

      // Commit the transaction, saving the changes to the database
      await transaction.commit();
    } catch (err) {
      // If an error occurs during the transaction, rollback the changes
      await transaction.rollback();
      throwCatchError(err);
    }

    return await getUserCompaniesByUserId(userCompany.id, { useMaster: true });
  }

  async blockOrUnblockUserCompany(id: number, user: User) {
    const userCompany = await UserCompanyRole.findByPk(id);
    if (!userCompany)
      throw new NotFoundException(RESPONSES.notFound('User Company'));

    const transaction = await this.sequelize.transaction();

    try {
      await UserCompanyRole.update(
        {
          blocked_at: userCompany.blocked_at ? null : moment(),
        },
        {
          where: { id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name }, // Custom field for hooks
        } as UpdateOptions & {
          editor: Editor;
        },
      );

      // Commit the transaction, saving the changes to the database
      await transaction.commit();
    } catch (err) {
      // If an error occurs during the transaction, rollback the changes
      await transaction.rollback();
      throwCatchError(err);
    }

    return await getUserCompaniesByUserId(userCompany.id, { useMaster: true });
  }

  async deleteUserCompany(id: number, user: User) {
    const userCompany = await UserCompanyRole.findByPk(id);
    if (!userCompany)
      throw new NotFoundException(RESPONSES.notFound('User Company'));

    const { company_id, user_id } = userCompany;

    // don't allow last user company role deletion
    const usersAllCompaniesCount = await UserCompanyRole.count({
      where: { user_id },
    });

    if (usersAllCompaniesCount === 1) {
      throw new BadRequestException(ERRORS.AT_LEAST_ONE_USER_COMPANY_REQUIRED);
    }

    const transaction = await this.sequelize.transaction();

    try {
      await UserCompanyRole.destroy({
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name },
      } as DestroyOptions & { editor: Editor });

      // disassociate this user from all departments of this company
      await disassociateUserFromCompanyDepartments(
        company_id,
        user_id,
        user,
        null,
        transaction,
      );

      // disassociate this user from all events of this company
      await disassociateUserFromPreviousCompanyEvents(
        company_id,
        user_id,
        transaction,
      );

      // Commit the transaction, saving the changes to the database
      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ UserCompaniesService ~ deleteUserCompany ~ err:', err);
      // If an error occurs during the transaction, rollback the changes
      await transaction.rollback();
      throwCatchError(err);
    }

    return { message: _MESSAGES.USER_COMPANY_SUCESSFULLY_DESTROYED };
  }
}
