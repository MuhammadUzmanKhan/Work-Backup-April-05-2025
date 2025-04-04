import { Op, Sequelize } from 'sequelize';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Alert,
  Company,
  Department,
  Event,
  EventContact,
  EventUser,
  IncidentType,
  PriorityGuide,
  Role,
  User,
  UserCompanyRole,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getPageAndPageSize,
  isEventExist,
  userRoleInclude,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  AlertableType,
  ERRORS,
  GlobalRoles,
  MESSAGES,
  Options,
  RESPONSES,
  RolesNumberEnum,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { SocketTypes, _MESSAGES } from '@Common/constants';
import { PriorityGuideService } from '@Modules/priority-guide/priority-guide.service';
import { checkEventOfSameCompany } from '@Common/helpers';
import {
  AvailableKeyContactDto,
  AvailableStaffUserDto,
  CreateAlertDto,
  CreateMultipleAlertDto,
  UpdateAlertDto,
  RemoveAllAlerts,
  CloneAlertsDto,
  CreateBulkAlertDto,
  GetAllAlerts,
  DeleteStaffAlert,
  ManageIncidentTypeAlertDto,
} from './dto';
import {
  alertCountHelper,
  createBulkAlerts,
  getAlertById,
  getAlertCountSubquery,
  getAlertInclude,
  getKeyContactCountWhereQuery,
  getUserCountWhereQuery,
  getUserWhereQuery,
  multipleAlertWhere,
  removeDuplicates,
  sendUpdatedAlert,
  staffAttributes,
  staffRolesArray,
} from './helpers';

@Injectable()
export class AlertService {
  constructor(
    private readonly priorityGuideService: PriorityGuideService,
    private readonly pusherService: PusherService,
  ) {}
  async createAlert(createAlertDto: CreateAlertDto, user: User) {
    let alert;
    let createdAlert;
    const {
      event_id,
      alertable_id,
      alertable_type,
      user_ids,
      event_contact_ids,
      remove_alerts,
    } = createAlertDto;

    // checking company level permission
    await withCompanyScope(user, event_id);

    // Added check to manage create and remove alert in incident_type model api
    if (remove_alerts) {
      await Alert.destroy({
        where: {
          alertable_type,
          event_id,
          ...(event_contact_ids?.length
            ? { event_contact_id: { [Op.in]: event_contact_ids } }
            : { user_id: { [Op.in]: user_ids } }),
        },
      });

      sendUpdatedAlert(
        {
          message: _MESSAGES.ALERT_SUCCESSFULLY_REMOVED,
        },
        event_id,
        'delete',
        SocketTypes.ALERT,
        false,
        this.pusherService,
      );

      return {
        message: MESSAGES.ALERT_SUCCESSFULLY_DESTROYED,
      };
    }
    if (user_ids) {
      createdAlert = user_ids.map((user_id) => {
        const updateFields = {
          user_id,
          alertable_id,
          event_id,
          alertable_type,
        };

        return Alert.findOrCreate({ where: updateFields });
      });

      alert = await Promise.all(createdAlert);
      const alertIds = alert.map(([alert]) => alert.dataValues.id);

      // to send alert data if only one user is created
      if (user_ids.length === 1)
        alert = await getAlertById(alertIds[0], alertable_type, {
          useMaster: true,
        });
    }

    if (event_contact_ids) {
      createdAlert = event_contact_ids.map((event_contact_id) => {
        const updateFields = {
          event_contact_id,
          alertable_id,
          event_id,
          alertable_type,
        };

        return Alert.findOrCreate({ where: updateFields });
      });

      alert = await Promise.all(createdAlert);
      const alertIds = alert.map(([alert]) => alert.dataValues.id);

      // to send alert data if only one user is created
      if (event_contact_ids.length === 1)
        alert = await getAlertById(alertIds[0], alertable_type, {
          useMaster: true,
        });
    }

    sendUpdatedAlert(
      {
        alert,
      },
      event_id,
      `new-${alertable_type}`,
      SocketTypes.ALERT,
      true,
      this.pusherService,
    );

    return {
      message: MESSAGES.ALERT_SUCCESSFULLY_ADDED,
      data: alert || '',
    };
  }

  async createMultipleAlert(
    createMultipleAlertDto: CreateMultipleAlertDto,
    user: User,
  ) {
    let alerts = [];
    const {
      event_id,
      alertable_ids,
      user_ids,
      event_contact_ids,
      alertable_type,
    } = createMultipleAlertDto;

    // checking company level permission
    await withCompanyScope(user, event_id);

    const existingAlerts = await Alert.findAll({
      where: multipleAlertWhere(
        event_id,
        alertable_ids,
        event_contact_ids,
        user_ids,
      ),
    });

    const existingAlertArray = existingAlerts.map((alert) => {
      return {
        event_id: alert.event_id,
        alertable_id: +alert.alertable_id,
        user_id: alert.user_id,
        event_contact_id: alert.event_contact_id,
      };
    });

    if (event_contact_ids?.length) {
      for (let i = 0; i < alertable_ids.length; i++) {
        for (let j = 0; j < event_contact_ids.length; j++) {
          alerts.push({
            event_contact_id: event_contact_ids[j],
            alertable_id: alertable_ids[i],
            event_id,
            alertable_type,
          });
        }
      }
    }
    // user remove duplicate
    if (user_ids?.length) {
      for (let i = 0; i < alertable_ids.length; i++) {
        for (let j = 0; j < user_ids.length; j++) {
          alerts.push({
            user_id: user_ids[j],
            alertable_id: alertable_ids[i],
            event_id,
            alertable_type,
          });
        }
      }
    }

    alerts = removeDuplicates(existingAlertArray, alerts);

    const createdAlerts = await Alert.bulkCreate(alerts);

    sendUpdatedAlert(
      {
        message: MESSAGES.ALERT_SUCCESSFULLY_ADDED,
        alerts: createdAlerts,
      },
      event_id,
      'new',
      SocketTypes.ALERT,
      true,
      this.pusherService,
    );

    return {
      message: MESSAGES.ALERT_SUCCESSFULLY_ADDED,
    };
  }

  async manageIncidentTypeAlerts(
    updateIncidentAlertsDto: ManageIncidentTypeAlertDto,
    user: User,
  ) {
    const {
      event_id,
      alertable_ids,
      alertable_type,
      user_id,
      event_contact_id,
    } = updateIncidentAlertsDto;

    await withCompanyScope(user, event_id);

    // Remove existing alerts for the specified user_id or event_contact_id
    await Alert.destroy({
      where: {
        alertable_type,
        ...(user_id ? { user_id } : {}),
        ...(event_contact_id ? { event_contact_id } : {}),
        event_id,
      },
    });

    // Create new alerts with the provided alertable_ids
    const newAlerts = alertable_ids.map((alertable_id) => ({
      alertable_id,
      alertable_type,
      ...(user_id ? { user_id } : { event_contact_id }),
      event_id,
    }));

    const createdAlerts = await Alert.bulkCreate(newAlerts);

    sendUpdatedAlert(
      {
        message: MESSAGES.ALERT_SUCCESSFULLY_ADDED,
        alerts: createdAlerts,
      },
      event_id,
      'new',
      SocketTypes.ALERT,
      true,
      this.pusherService,
    );

    return {
      message: MESSAGES.ALERT_SUCCESSFULLY_ADDED,
      data: newAlerts,
    };
  }

  async createBulkAlert(createBulkAlertDto: CreateBulkAlertDto, user: User) {
    let alert;
    const { event_id, alertable_type } = createBulkAlertDto;

    // checking company level permission
    await withCompanyScope(user, event_id);

    // Create bulk alert by checking user_id and event_contact_id dynamcially
    await createBulkAlerts(createBulkAlertDto);

    const allIncidentTypeAndPriorityGuideCount =
      await this.getAllIncidentTypeAndPriorityGuideCount(event_id, {
        useMaster: true,
      });

    sendUpdatedAlert(
      {
        alert,
        incidentTypePriorityGuideCount: allIncidentTypeAndPriorityGuideCount,
      },
      event_id,
      `new-${alertable_type}`,
      SocketTypes.ALERT,
      true,
      this.pusherService,
    );

    return {
      message: MESSAGES.ALERT_SUCCESSFULLY_ADDED,
      data: alert || '',
    };
  }

  async cloneAlerts(user: User, cloneAlerts: CloneAlertsDto) {
    const { clone_event_id, current_event_id, alertable_type } = cloneAlerts;

    await checkEventOfSameCompany(user, clone_event_id, current_event_id);

    const existingAlerts = (
      await Alert.findAll({
        where: { event_id: clone_event_id, alertable_type },
        attributes: [
          'event_contact_id',
          'user_id',
          'sms_alert',
          'email_alert',
          'alertable_id',
          'alertable_type',
        ],
        include: [
          {
            model: PriorityGuide,
            attributes: ['priority'],
          },
        ],
      })
    ).map((data) => ({
      event_contact_id: data.event_contact_id,
      user_id: data.user_id,
      sms_alert: data.sms_alert,
      email_alert: data.email_alert,
      priority: data.priority_guide.priority,
    }));

    if (!existingAlerts)
      throw new BadRequestException(RESPONSES.notFound('Alerts'));

    const clonePriorityGuide = (
      await PriorityGuide.findAll({
        where: { event_id: clone_event_id },
        attributes: ['name', 'priority', 'description', 'scale_setting'],
      })
    ).map((data) => ({
      name: data.name,
      priority: data.priority,
      description: data.description,
      scale_setting: data.scale_setting,
    }));

    const currentPriorityGuide = await PriorityGuide.findAll({
      where: { event_id: current_event_id },
    });

    if (!currentPriorityGuide.length) {
      for (const priorityGuide of clonePriorityGuide) {
        const { name, priority, description, scale_setting } = priorityGuide;
        const priority_guide = await PriorityGuide.create({
          name,
          priority,
          description,
          scale_setting,
          event_id: current_event_id,
        });
        currentPriorityGuide.push(priority_guide);
      }
    }

    for (const existingAlert of existingAlerts) {
      const { event_contact_id, user_id, sms_alert, email_alert, priority } =
        existingAlert;

      const priorityGuide = currentPriorityGuide.find(
        (item) => item.priority === priority,
      );

      await Alert.findOrCreate({
        where: {
          event_id: current_event_id,
          event_contact_id,
          user_id,
          sms_alert,
          email_alert,
          alertable_type,
          alertable_id: priorityGuide.id,
        },
        useMaster: true,
      });
    }

    const allIncidentTypeAndPriorityGuideCount =
      await this.getAllIncidentTypeAndPriorityGuideCount(current_event_id, {
        useMaster: true,
      });

    sendUpdatedAlert(
      {
        message: 'Alerts Cloned Successfully',
        incidentTypePriorityGuideCount: allIncidentTypeAndPriorityGuideCount,
      },
      current_event_id,
      'clone',
      SocketTypes.ALERT,
      true,
      this.pusherService,
    );

    return { message: 'Alerts Cloned Successfully' };
  }

  async getAvailableKeyContact(
    availableKeyContactDto: AvailableKeyContactDto,
    user: User,
  ) {
    let priorityGuideUser: number[];
    let incidentTypeUsersIds: number[];

    const {
      event_id,
      keyword,
      alertable_type,
      priority_guide_id,
      page,
      page_size,
      assigned_incident_types,
      sort_column,
      order,
      incident_type_id,
    } = availableKeyContactDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    const [company_id] = await withCompanyScope(user, event_id);

    if (priority_guide_id) {
      const priorityGuide = await EventContact.findAll({
        attributes: [
          'id',
          'title',
          'contact_phone',
          'name',
          'contact_email',
          'first_name',
          'last_name',
          'contact_name',
          'country_code',
          'country_iso_code',
          'company_id',
          'description',
          [
            Sequelize.literal(`(
              SELECT ("companies"."name") FROM "companies"
              WHERE "companies"."id" = "EventContact"."company_id"
            )`),
            'company_name',
          ],
        ],
        include: [
          {
            model: Alert,
            attributes: ['id', 'email_alert', 'sms_alert'],

            include: [
              {
                model: PriorityGuide,
                where: { id: priority_guide_id },
                attributes: [
                  'id',
                  'description',
                  'name',
                  'scale_setting',
                  'priority',
                ],
              },
            ],
            required: true,
          },
        ],
      });

      priorityGuideUser = priorityGuide.map((data) => data.id);
    }

    if (incident_type_id) {
      const staff = await EventContact.findAll({
        attributes: ['id'],
        include: [
          {
            model: Alert,
            attributes: [],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
            },
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
              },
            ],
          },
        ],
        subQuery: false,
      });
      incidentTypeUsersIds = staff.map((data) => data.id);
    }

    const eventContacts = await EventContact.findAndCountAll({
      where: getKeyContactCountWhereQuery(
        company_id,
        keyword,
        priorityGuideUser,
        incidentTypeUsersIds,
      ),
      attributes: [
        'id',
        'created_at',
        'first_name',
        [
          getAlertCountSubquery(
            'EventContact',
            'event_contact_id',
            event_id,
            alertable_type,
          ),
          'alert_count',
        ],
      ],
      include: getAlertInclude(
        event_id,
        alertable_type,
        assigned_incident_types,
        true,
      ),
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      order: [
        [Sequelize.literal('"alert_count"'), 'DESC'], // Sort by whether alert exists
        [sort_column || 'first_name', order || SortBy.ASC],
      ],
      distinct: true,
    });
    const { count, rows } = eventContacts;
    const eventContactIds = rows.map((data) => data.id);

    const eventContactData = await EventContact.findAll({
      where: { id: { [Op.in]: eventContactIds } },
      attributes: {
        exclude: ['event_id', 'expected_presence', 'city', 'updated_at'],
        include: [
          [EventContact.getInfoTypeByKey, 'info_type'],
          [
            Sequelize.literal(`(
                SELECT ("companies"."name") FROM "companies"
                WHERE "companies"."id" = "EventContact"."company_id"
              )`),
            'company_name',
          ],
          [
            getAlertCountSubquery(
              'EventContact',
              'event_contact_id',
              event_id,
              alertable_type,
            ),
            'alert_count',
          ],
        ],
      },
      include: getAlertInclude(
        event_id,
        alertable_type,
        assigned_incident_types,
        true,
      ),
      order: [
        [Sequelize.literal('"alert_count"'), 'DESC'], // Sort by whether alert exists
        [sort_column || 'first_name', order || SortBy.ASC],
      ],
    });

    return {
      data: eventContactData,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async getAvailableStaffUser(
    availableStaffUserDto: AvailableStaffUserDto,
    user: User,
  ) {
    let priorityGuideUser: number[];
    let incidentTypeUsersIds: number[];

    const {
      event_id,
      department_id,
      alertable_type,
      priority_guide_id,
      keyword,
      page,
      page_size,
      assigned_incident_types,
      sort_column,
      order,
      incident_type_id,
      global_roles,
    } = availableStaffUserDto;

    if (global_roles && user['role'] !== RolesNumberEnum.SUPER_ADMIN)
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const [companyId] = await withCompanyScope(user, event_id);

    if (priority_guide_id) {
      const priorityUsers =
        await this.priorityGuideService.getPriorityGuideById(priority_guide_id);
      priorityGuideUser = priorityUsers.data.map((data) => data.id);
    }

    if (incident_type_id) {
      const staff = await User.findAll({
        where: { blocked_at: { [Op.eq]: null } },
        attributes: ['id'],
        include: [
          {
            model: Alert,
            attributes: [],
            where: {
              event_id,
              alertable_type: AlertableType.INCIDENT_TYPE,
            },
            include: [
              {
                model: IncidentType,
                attributes: [],
                where: { id: incident_type_id },
              },
            ],
          },
        ],
        subQuery: false,
      });
      incidentTypeUsersIds = staff.map((data) => data.id);
    }

    const users = await User.findAndCountAll({
      attributes: [
        'id',
        'cell',
        'email',
        'name',
        'first_name',
        'last_name',
        'created_at',
        [
          getAlertCountSubquery('User', 'user_id', event_id, alertable_type),
          'alert_count',
        ],
      ],
      where: getUserCountWhereQuery(
        keyword,
        priorityGuideUser,
        incidentTypeUsersIds,
      ),
      include: [
        {
          model: UserCompanyRole,
          attributes: [],
          where: {
            role_id: {
              [Op.in]: global_roles ? GlobalRoles : staffRolesArray, //global roles to get upper roles for super-admin
            },
            company_id: companyId,
          },
        },
        {
          model: EventUser,
          attributes: [],
          where: { event_id },
        },
        {
          model: Department,
          attributes: [],
          where: department_id ? { id: department_id } : {},
          include: [
            {
              model: Event,
              attributes: [],
              where: { id: event_id },
            },
            {
              model: Company,
              attributes: ['name'],
            },
          ],
        },
        ...getAlertInclude(event_id, alertable_type, assigned_incident_types),
      ],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      distinct: true,
      order: [
        [Sequelize.literal('"alert_count"'), 'DESC'], // Sort by whether alert exists
        [sort_column || 'name', order || SortBy.ASC],
      ],
    });

    const usersIds = users.rows.map((data) => data.id);

    const staffUsers = await User.findAll({
      where: getUserWhereQuery(keyword, usersIds),
      attributes: [
        'id',
        'cell',
        'email',
        'name',
        'first_name',
        'last_name',
        'created_at',
        'country_code',
        'country_iso_code',
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
        [
          Sequelize.literal(`"users_companies_roles->company"."name"`),
          'company_name',
        ],
        [
          getAlertCountSubquery('User', 'user_id', event_id, alertable_type),
          'alert_count',
        ],
      ],
      include: [
        ...userRoleInclude(companyId),
        {
          model: Alert,
          where: { event_id, alertable_type },
          attributes: staffAttributes(alertable_type),
          required: false,
        },
      ],
      order: [
        [Sequelize.literal('"alert_count"'), 'DESC'], // Sort by whether alert exists
        [sort_column || 'name', order || SortBy.ASC],
      ],
    });

    const { count } = users;

    return {
      data: staffUsers,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async getAllIncidentTypeAndPriorityGuideCount(
    event_id: number,
    options?: Options,
  ) {
    const {
      priorityGuideKeyContactCount,
      priorityGuideUsersCount,
      incidentTypeKeyContactCount,
      incidentTypeUserCount,
    } = await alertCountHelper(event_id, options);

    return {
      allIncidentTypeCount:
        incidentTypeUserCount + incidentTypeKeyContactCount || 0,
      priorityGuideKeyContactCount,
      priorityGuideUsersCount,
      incidentTypeKeyContactCount,
      incidentTypeUserCount,
    };
  }

  async getAlertCount(event_id: number) {
    isEventExist(event_id);

    const priorityGuideAlert = await Alert.count({
      where: {
        event_id,
        alertable_type: AlertableType.PRIORITY_GUIDE,
      },
    });

    const incidentTypeAlert = await Alert.count({
      where: {
        event_id,
        alertable_type: AlertableType.INCIDENT_TYPE,
      },
    });

    return { priorityGuideAlert, incidentTypeAlert };
  }

  async getAllAlerts(getAllAlerts: GetAllAlerts, user: User) {
    const { event_id, keyword, alertable_type } = getAllAlerts;
    const [company_id] = await withCompanyScope(user, event_id);

    const users = await User.findAll({
      attributes: [
        'id',
        'cell',
        'email',
        'name',
        'first_name',
        'last_name',
        'created_at',
        'country_code',
        'country_iso_code',
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
        [
          Sequelize.literal(`"users_companies_roles->company"."name"`),
          'company_name',
        ],
      ],
      where: getUserCountWhereQuery(keyword),
      include: [
        {
          model: EventUser,
          attributes: [],
          where: { event_id },
        },
        ...getAlertInclude(event_id, alertable_type, true),
        ...userRoleInclude(company_id),
      ],
      order: [['name', SortBy.ASC]],
    });

    const eventContacts = await EventContact.findAll({
      where: getKeyContactCountWhereQuery(company_id, keyword),
      attributes: {
        exclude: ['event_id', 'expected_presence', 'city', 'updated_at'],
        include: [
          [
            Sequelize.cast(Sequelize.col('"EventContact"."id"'), 'integer'),
            'id',
          ],
          [EventContact.getInfoTypeByKey, 'info_type'],
          [
            Sequelize.literal(`(
                SELECT ("companies"."name") FROM "companies"
                WHERE "companies"."id" = "EventContact"."company_id"
              )`),
            'company_name',
          ],
        ],
      },
      include: [...getAlertInclude(event_id, alertable_type, true, true)],
      order: [['name', SortBy.ASC]],
    });

    const allAlerts = [...users, ...eventContacts];

    // Sort the merged array by name in ascending order
    allAlerts.sort((a, b) => a.name.localeCompare(b.name));

    return {
      data: allAlerts,
      count: calculatePagination(allAlerts?.length, 0, 1), //sending all data for all_users case and only sending count and page size and page are just dummy values
    };
  }

  async getAllAlertsStaffNames(getAllAlerts: GetAllAlerts, user: User) {
    const { event_id, keyword, alertable_type } = getAllAlerts;
    const [company_id] = await withCompanyScope(user, event_id);

    const users = await User.findAll({
      attributes: [
        'id',
        'name',
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
      ],
      where: getUserCountWhereQuery(keyword),
      include: [
        {
          model: EventUser,
          attributes: [],
          where: { event_id },
        },
        {
          model: UserCompanyRole,
          attributes: [],
          where: {
            role_id: {
              [Op.in]: staffRolesArray,
            },
            company_id: company_id,
          },
          include: [
            {
              model: Role,
              attributes: [],
            },
          ],
        },
      ],
    });

    const eventContacts = await EventContact.findAll({
      where: getKeyContactCountWhereQuery(company_id, keyword),
      attributes: [
        'id',
        'name',
        [
          Sequelize.literal(`(
                SELECT ("companies"."name") FROM "companies"
                WHERE "companies"."id" = "EventContact"."company_id"
              )`),
          'company_name',
        ],
      ],
    });

    const allAlerts = [...users, ...eventContacts];

    // Sort the merged array by name in ascending order
    allAlerts.sort((a, b) => a.name.localeCompare(b.name));

    return allAlerts;
  }

  async updateAlert(id: number, updateAlertDto: UpdateAlertDto) {
    const { event_id } = updateAlertDto;

    const alert = await Alert.findOne({
      attributes: { exclude: ['updatedAt'] },
      where: { id, event_id },
    });
    if (!alert) throw new NotFoundException(ERRORS.ALERT_NOT_FOUND);

    const updatedAlert = await alert.update({ ...updateAlertDto });

    const allIncidentTypeAndPriorityGuideCount =
      await this.getAllIncidentTypeAndPriorityGuideCount(event_id, {
        useMaster: true,
      });

    sendUpdatedAlert(
      {
        alert: updatedAlert,
        incidentTypePriorityGuideCount: allIncidentTypeAndPriorityGuideCount,
      },
      event_id,
      `update-${updatedAlert.alertable_type}`,
      SocketTypes.ALERT,
      false,
      this.pusherService,
    );

    return updatedAlert;
  }

  async deleteAlert(id: number, event_id: number) {
    const alert = await Alert.findOne({
      attributes: [
        'id',
        'event_contact_id',
        'user_id',
        [
          Sequelize.literal(
            '(SELECT name FROM "priority_guides" WHERE "priority_guides"."id" = "Alert"."alertable_id")',
          ),
          'priority_name',
        ],
        'alertable_type',
        'alertable_id',
      ],
      where: { id, event_id },
    });

    if (!alert) throw new NotFoundException(ERRORS.ALERT_NOT_FOUND);

    await alert.destroy();

    const allIncidentTypeAndPriorityGuideCount =
      await this.getAllIncidentTypeAndPriorityGuideCount(event_id);

    const { event_contact_id, user_id } = alert;

    sendUpdatedAlert(
      {
        message: _MESSAGES.ALERT_SUCCESSFULLY_REMOVED,
        incidentTypePriorityGuideCount: allIncidentTypeAndPriorityGuideCount,
        alert_id: id,
        event_contact_id,
        user_id,
        priority_name: alert.get('priority_name'),
        alertable_id: alert.alertable_id,
      },
      event_id,
      `delete-${alert.alertable_type}`,
      SocketTypes.ALERT,
      false,
      this.pusherService,
    );

    return { message: _MESSAGES.ALERT_SUCCESSFULLY_REMOVED };
  }

  async deleteStaffAlert(id: number, deleteStaffAlert: DeleteStaffAlert) {
    const { alertable_type, event_id, is_key_contact } = deleteStaffAlert;

    await Alert.destroy({
      where: {
        alertable_type,
        event_id,
        [is_key_contact ? 'event_contact_id' : 'user_id']: id,
      },
    });

    const allIncidentTypeAndPriorityGuideCount =
      await this.getAllIncidentTypeAndPriorityGuideCount(event_id);

    sendUpdatedAlert(
      {
        message: _MESSAGES.ALERT_SUCCESSFULLY_REMOVED,
        incidentTypePriorityGuideCount: allIncidentTypeAndPriorityGuideCount,
      },
      event_id,
      'delete',
      SocketTypes.ALERT,
      false,
      this.pusherService,
    );

    return { message: _MESSAGES.ALERT_SUCCESSFULLY_REMOVED };
  }

  async removeAllAlerts(removeAllAlerts: RemoveAllAlerts) {
    const { event_id, alertable_id } = removeAllAlerts;

    const priority_guide = await PriorityGuide.findOne({
      attributes: ['id'],
      where: { id: alertable_id, event_id },
    });
    if (!priority_guide)
      throw new NotFoundException(ERRORS.PRIORITY_GUIDE_NOT_FOUND);

    await Alert.destroy({
      where: {
        event_id,
        alertable_id,
      },
    });

    const allIncidentTypeAndPriorityGuideCount =
      await this.getAllIncidentTypeAndPriorityGuideCount(event_id);

    sendUpdatedAlert(
      {
        message: _MESSAGES.ALERT_SUCCESSFULLY_REMOVED,
        incidentTypePriorityGuideCount: allIncidentTypeAndPriorityGuideCount,
      },
      event_id,
      'delete',
      SocketTypes.ALERT,
      false,
      this.pusherService,
    );

    return { message: _MESSAGES.ALERT_SUCCESSFULLY_REMOVED };
  }
}
