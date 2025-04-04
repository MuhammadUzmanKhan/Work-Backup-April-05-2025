import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Sequelize } from 'sequelize-typescript';
import { Includeable, Op, QueryTypes } from 'sequelize';
import { HttpService } from '@nestjs/axios';
import {
  Department,
  DepartmentUsers,
  EventDepartment,
  EventUser,
  MessageGroup,
  User,
  UserIncidentDivision,
} from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  MessageGroupableType,
  Options,
  RESPONSES,
  SortBy,
  rails_webhook_url,
} from '@ontrack-tech-group/common/constants';
import {
  PusherService,
  postRequest,
} from '@ontrack-tech-group/common/services';
import {
  calculatePagination,
  getArrayInChunks,
  getPageAndPageSize,
  successInterceptorResponseFormat,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { RailsWebhookChannel, SocketTypes } from '@Common/constants';
import { CloneDto } from '@Common/dto';
import {
  createAndUpdateMessageGroup,
  departmentAttributes,
  departmentCompaniesPermission,
  generateCsvOrPdfForDepartmentsCardView,
  getStaffCounts,
  fetchCompletedEventUsers,
  sendUpdatedWorkforceDepartments,
  getDepartmentCount,
  isDepartmentExistWithName,
  checkIfEventDepartmentExist,
  eventDepartmentCount,
  getDepartmentHelper,
} from './helpers';
import {
  UpdateDepartmentDto,
  DepartmentAssocitateOrDisassociateToEventDto,
  DisassociateDepartmentDto,
  DepartmentsQueryDto,
  CreateDepartmentDto,
  GetDepartmentNamesByEventDto,
  EventUserDepartmentDto,
} from './dto';
import { getDepartmentStaffCount } from './queries';

@Injectable()
export class DepartmentService {
  constructor(
    private sequelize: Sequelize,
    private readonly pusherService: PusherService,
    private readonly httpService: HttpService,
  ) {}
  // Create new department against company
  async createDepartment(body: CreateDepartmentDto, user: User) {
    const { event_id, name } = body;
    let company_id = body['company_id'];
    let newDepartment: Department;

    // Check if event exists
    if (event_id) [company_id] = await withCompanyScope(user, event_id);

    await isDepartmentExistWithName(name, company_id);

    const transaction = await this.sequelize.transaction();

    try {
      newDepartment = await Department.create(
        { ...body, company_id },
        { transaction },
      );

      if (event_id) {
        await EventDepartment.create(
          { event_id, department_id: newDepartment.id },
          { transaction },
        );

        await MessageGroup.create(
          {
            event_id,
            company_id,
            name,
            message_groupable_id: newDepartment.id,
            message_groupable_type: MessageGroupableType.DEPARTMENT,
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    const departmentData = await this.getDepartmentById(
      newDepartment.id,
      user,
      event_id,
      { useMaster: true },
    );

    const departmentCount = await eventDepartmentCount(event_id);

    const socketData = {
      ...departmentData,
      departmentCount,
    };

    // Pusher for department updates
    this.pusherService.sendUpdateDepartment(
      socketData,
      event_id,
      newDepartment.id,
    );

    return departmentData;
  }

  // Below api's are using in workforce module
  async disassociateDepartmentsFromEvent(
    body: DisassociateDepartmentDto,
    user: User,
    req: Request,
  ) {
    const { event_id, department_ids } = body;
    // checking company level permission
    const [company_id] = await withCompanyScope(user, event_id);

    await checkIfEventDepartmentExist(event_id, department_ids);

    const eventUsers = await EventUser.findAll({
      where: {
        event_id,
      },
      attributes: ['id'],
      include: [
        {
          model: User,
          attributes: ['id'],
          required: true,
          include: [
            {
              model: Department,
              attributes: ['id'],
              where: {
                id: { [Op.in]: department_ids },
                company_id,
              },
            },
          ],
        },
      ],
    });

    const transaction = await this.sequelize.transaction();

    try {
      await EventDepartment.destroy({
        where: { event_id, department_id: { [Op.in]: department_ids } },
        transaction,
      });

      await MessageGroup.destroy({
        where: {
          event_id,
          message_groupable_type: 'Department',
          message_groupable_id: { [Op.in]: department_ids },
        },
        transaction,
      });

      if (eventUsers.length)
        await EventUser.destroy({
          where: {
            id: { [Op.in]: eventUsers.map((eventUser) => eventUser.id) },
          },
          transaction,
        });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    // Pusher for department disassociate departments
    const { departments } = await getDepartmentHelper(
      { event_id: null } as DepartmentsQueryDto,
      user,
      company_id,
      1,
      100,
      { useMaster: true },
      department_ids,
    );

    const { activeCounts, staffCounts } = await getStaffCounts(
      event_id,
      true,
      company_id,
      user,
    );

    const departmentChunk = getArrayInChunks(
      departments.map((dep) => dep.toJSON()),
      5,
    );

    for (const data of departmentChunk) {
      const socketData = {
        departments: [...data],
        counts: { activeCounts, staffCounts },
      };

      this.pusherService.disassociateDepartmentFromEvent(socketData, event_id);
    }

    const webhookData = {
      body: {
        company_id,
        event_id,
      },
      channel_name: RailsWebhookChannel.REMOVE_DEPARTMENT,
    };

    try {
      postRequest(
        req.headers.authorization,
        this.httpService,
        webhookData,
        rails_webhook_url,
      );
    } catch (err) {
      console.log('🚀 ~ DepartmentService ~ err:', err);
    }

    return { message: 'Successfully disassociated' };
  }

  async assignDepartmentsToEvent(
    departmentAssocitateOrDisassociateToEventDto: DepartmentAssocitateOrDisassociateToEventDto,
    user: User,
    req: Request,
  ) {
    const { event_id, department_ids } =
      departmentAssocitateOrDisassociateToEventDto;
    const transaction = await this.sequelize.transaction();

    const [company_id] = await withCompanyScope(user, event_id);

    for (const departmentId of department_ids) {
      const department = await Department.findOne({
        where: await departmentCompaniesPermission(departmentId, user),
        include: [
          {
            model: User,
            attributes: ['id'],
            through: { attributes: [] },
          },
        ],
      });
      if (!department) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);

      const departmentUserIds = department.users.map((user) => user.id);

      const { eventUserIds, completedEventId } = await fetchCompletedEventUsers(
        departmentId,
        user,
      );

      try {
        await EventDepartment.findOrCreate({
          where: { event_id, department_id: departmentId },
          transaction,
        });

        if (eventUserIds?.length) {
          for (const user_id of eventUserIds) {
            await EventUser.findOrCreate({
              where: { event_id, user_id },
              transaction,
            });
          }
        } else if (!completedEventId || completedEventId === undefined) {
          for (const user_id of departmentUserIds) {
            await EventUser.findOrCreate({
              where: { event_id, user_id },
              transaction,
            });
          }
        }

        await createAndUpdateMessageGroup(department, event_id, transaction);
      } catch (err) {
        console.log('🚀 ~ DepartmentService ~ err:', err);
        await transaction.rollback();
        throwCatchError(err);
      }
    }

    await transaction.commit();

    const { departments } = await getDepartmentHelper(
      { event_id, is_assigned: true } as DepartmentsQueryDto,
      user,
      company_id,
      1,
      100,
      { useMaster: true },
      department_ids,
    );

    const { activeCounts, staffCounts } = await getStaffCounts(
      event_id,
      true,
      company_id,
      user,
    );

    const departmentChunk = getArrayInChunks(
      departments.map((dep) => dep.toJSON()),
      5,
    );

    for (const data of departmentChunk) {
      const socketData = {
        departments: [...data],
        counts: { activeCounts, staffCounts },
      };

      this.pusherService.assignDepartmentToEvents(null, event_id, socketData);
    }

    const webhookData = {
      body: {
        company_id,
        event_id,
      },
      channel_name: RailsWebhookChannel.ASSIGN_DEPARTMENT,
    };

    try {
      postRequest(
        req.headers.authorization,
        this.httpService,
        webhookData,
        rails_webhook_url,
      );
    } catch (err) {
      console.log('🚀 ~ DepartmentService ~ err:', err);
    }

    return {
      message: 'Associated Successfully',
    };
  }

  async cloneEventDepartment(cloneDepartment: CloneDto, user: User) {
    const { current_event_id, clone_event_id } = cloneDepartment;

    const [company_id] = await withCompanyScope(user, clone_event_id);

    const existingDepartment = await EventDepartment.findAll({
      where: { event_id: clone_event_id },
      attributes: ['department_id'],
    });

    const department_ids = existingDepartment.map((data) => data.department_id);

    if (!department_ids.length)
      throw new NotFoundException(RESPONSES.notFound('Departments'));

    for (const department_id of department_ids) {
      await EventDepartment.findOrCreate({
        where: {
          event_id: current_event_id,
          department_id,
        },
      });
    }

    const count = getDepartmentCount(company_id, { useMaster: true });

    sendUpdatedWorkforceDepartments(
      { message: 'Departments Cloned Successfully', count },
      current_event_id,
      'clone',
      SocketTypes.DEPARTMENT,
      true,
      this.pusherService,
    );

    return { message: 'Departments Cloned Successfully' };
  }

  // Get all departments linked with the event
  async getDepartments(
    filters: DepartmentsQueryDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_id, csv_pdf, is_assigned, page, page_size } = filters;
    let companyId: number;
    let staffCounts: number;
    let activeCounts: number;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    if (event_id) {
      const [company_id] = await withCompanyScope(user, event_id);
      companyId = company_id;
    }

    const { departments, count } = await getDepartmentHelper(
      filters,
      user,
      companyId,
      page,
      page_size,
    );

    const _rows = departments.map((department) =>
      department.get({ plain: true }),
    );

    if (csv_pdf) {
      return await generateCsvOrPdfForDepartmentsCardView(
        filters,
        req,
        res,
        this.httpService,
        _rows,
      );
    }

    if (event_id) {
      ({ staffCounts, activeCounts } = await getStaffCounts(
        event_id,
        is_assigned,
        companyId,
        user,
      ));
      // eventDepartments = await getEventDepartmentCounts(event_id, companyId);
    }

    return res.send(
      successInterceptorResponseFormat({
        counts: { staffCounts, activeCounts, eventDepartments: 0, count },
        data: _rows,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async findAllDepartmentNamesByEvent(
    query: GetDepartmentNamesByEventDto,
    user: User,
  ) {
    const { company_id: companyId, event_id } = query;
    let company_id: number;

    const include: Includeable[] = [
      {
        model: DepartmentUsers,
        attributes: [],
      },
    ];

    if (!companyId && !event_id)
      throw new ForbiddenException(ERRORS.EVENT_ID_REQUIRED);

    if (event_id) {
      [company_id] = await withCompanyScope(user, event_id);

      include.push({
        model: EventDepartment,
        attributes: [],
        where: event_id ? { event_id } : {},
      });
    }

    return await Department.findAll({
      where: companyId ? { company_id: companyId } : {},
      attributes: [
        'id',
        'name',
        event_id
          ? getDepartmentStaffCount(
              company_id,
              event_id,
              +user['role'],
              'users_count',
            )
          : [
              Sequelize.cast(
                Sequelize.fn('COUNT', Sequelize.col(`"department_users"."id"`)),
                'INTEGER',
              ),
              'users_count',
            ],
      ],
      include,
      order: [['name', SortBy.ASC]],
      group: [`"Department"."id"`],
    });
  }

  // Get all departments linked with the event
  async getDepartmentById(
    departmentId: number,
    user: User,
    event_id?: number,
    options?: Options,
  ) {
    let _divisionWhere = {};
    let companyId: number;
    if (event_id) {
      _divisionWhere = { event_id: event_id };
      const [company_id] = await withCompanyScope(user, event_id);
      companyId = company_id as number;
    }

    // Check if department exist
    const department = await Department.findOne({
      where: {
        id: departmentId,
      },
      attributes: [
        'id',
        'name',
        'created_at',
        'updated_at',
        ...(event_id
          ? departmentAttributes(companyId, event_id, +user['role'])
          : []),
      ],
      include: [
        {
          model: DepartmentUsers,
          attributes: ['id'],
          include: [
            {
              model: User,
              attributes: ['id'],
              include: [
                {
                  model: UserIncidentDivision,
                  where: _divisionWhere,
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      ...options,
    });

    if (!department) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);

    const department_users: DepartmentUsers[] = department.department_users;
    const divisions = [];
    department_users.forEach((department_users) =>
      department_users.user?.user_incident_divisions?.forEach((division) =>
        divisions.push(division.incident_division),
      ),
    );
    delete department['dataValues']['department_users'];
    return {
      ...department.toJSON(),
      divisions: [...new Set(divisions)].length,
    };
  }

  // Update the department against event
  async updateDepartment(
    id: number,
    body: UpdateDepartmentDto,
    user: User,
    req: Request,
  ) {
    const { event_id, name } = body;

    // checking is department exist or not
    const department = await Department.findOne({
      where: await departmentCompaniesPermission(id, user),
      attributes: ['id', 'company_id'],
    });
    if (!department) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);

    // checking if  department exist with the same name within a company or not
    await isDepartmentExistWithName(name, department.company_id, id);

    const eventDepartment = await EventDepartment.findOne({
      where: { event_id, department_id: id },
    });

    const transaction = await this.sequelize.transaction();

    try {
      await department.update({ ...body }, { transaction });

      if (eventDepartment) {
        await createAndUpdateMessageGroup(department, eventDepartment.event_id);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    const departmentData = await this.getDepartmentById(id, user, +event_id, {
      useMaster: true,
    });

    const departmentCount = await eventDepartmentCount(+event_id);

    const socketData = {
      ...departmentData,
      departmentCount,
    };

    // Pusher for department updates
    this.pusherService.sendUpdateDepartment(
      socketData,
      +body.event_id,
      department.id,
    );

    const webhookData = {
      body: {
        company_id: department.company_id,
        event_id,
      },
      channel_name: RailsWebhookChannel.DEPARTMENT_UPDATE,
    };

    try {
      postRequest(
        req.headers.authorization,
        this.httpService,
        webhookData,
        rails_webhook_url,
      );
    } catch (err) {
      console.log('🚀 ~ DepartmentService ~ err:', err);
    }

    return department.toJSON();
  }

  async getDepartmentByEventWithUserDivision(
    eventId: number,
    eventUserDepartmentDto: EventUserDepartmentDto,
    res: Response,
    req: Request,
  ) {
    const query = `SELECT * from get_departments_by_event_with_user_division_count(${eventId});`;
    const departmentData: Department[] = await this.sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    if (eventUserDepartmentDto.csv_pdf) {
      return await generateCsvOrPdfForDepartmentsCardView(
        eventUserDepartmentDto,
        req,
        res,
        this.httpService,
        departmentData,
      );
    }
    return res.send(
      successInterceptorResponseFormat({
        data: departmentData,
      }),
    );
  }
}
