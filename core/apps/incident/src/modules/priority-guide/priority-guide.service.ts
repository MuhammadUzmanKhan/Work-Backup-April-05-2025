import { Op, Sequelize } from 'sequelize';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Alert,
  Company,
  DepartmentUsers,
  EventContact,
  PriorityGuide,
  User,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getPageAndPageSize,
  isEventExist,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  ERRORS,
  PriorityGuideFilter,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import { PriorityGuideMessages, SocketTypes } from '@Common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { AlertService } from '@Modules/alert/alert.service';
import {
  GetAllPriorityGuideDto,
  GetPriorityGuideById,
  UpdatePriorityGuideDto,
  UpdatePriorityGuideScaleSettingDto,
} from './dto';
import {
  getAllPriorityGuideHelper,
  getAllPriorityGuideWhere,
  priorityGuideByIdInclude,
  priorityGuideByIdWhere,
  priorityGuideOrder,
  sendUpdatedPriorityGuide,
} from './helpers';
import { priorityIncidentTypes } from './queries';

@Injectable()
export class PriorityGuideService {
  constructor(
    @Inject(forwardRef(() => AlertService))
    private readonly alertService: AlertService,

    @Inject(forwardRef(() => PusherService))
    private readonly pusherService: PusherService,
  ) {}

  async getAllPriorityGuides(
    getAllPriorityGuideDto: GetAllPriorityGuideDto,
    user: User,
  ) {
    const { sort_column, order, department_id, event_id } =
      getAllPriorityGuideDto;

    await isEventExist(event_id);
    const [company_id] = await withCompanyScope(user, event_id);

    return await PriorityGuide.findAll({
      where: getAllPriorityGuideWhere(getAllPriorityGuideDto),
      attributes: {
        include: [
          [Sequelize.literal('CAST("PriorityGuide"."id" AS INTEGER)'), 'id'],
          [PriorityGuide.getPriorityNameByKey, 'priority'],
          priorityIncidentTypes(company_id, event_id),
          [
            Sequelize.literal(`(
                SELECT COUNT ("alerts"."id")::INTEGER FROM alerts 
                WHERE "alerts"."alertable_id" = "PriorityGuide"."id" AND "alerts"."alertable_type" = 'PriorityGuide'
              )`),
            'priority_guide_alert_count',
          ],
          [
            Sequelize.literal(`(
              SELECT COUNT ("alerts"."id")::INTEGER FROM alerts 
              WHERE "alerts"."alertable_id" = "PriorityGuide"."id" AND "alerts"."alertable_type" = 'PriorityGuide' AND
              "alerts"."event_contact_id" IS NOT NULL
            )`),
            'priority_guide_alert_event_contact',
          ],
          [
            Sequelize.literal(`
              (
                SELECT COUNT("alerts"."id")::INTEGER FROM alerts 
                ${department_id ? 'INNER JOIN "department_users" ON "department_users"."user_id" = "alerts"."user_id" ' : ''}
                INNER JOIN "event_users" ON "event_users"."event_id" = "alerts"."event_id" AND  "event_users"."user_id"= "alerts"."user_id"
                WHERE "alerts"."alertable_id" = "PriorityGuide"."id" AND "alerts"."alertable_type" = 'PriorityGuide' AND
                "alerts"."user_id" IS NOT NULL 
                ${department_id ? `AND "department_users"."department_id" = ${department_id}` : ''}
              )
            `),
            'priority_guide_alert_user',
          ],
        ],
      },
      include: [
        {
          model: Alert,
          attributes: ['id', 'email_alert', 'sms_alert'],
          where: { event_id },
          required: false,
          include: [
            {
              model: User,
              attributes: [
                'id',
                'first_name',
                'last_name',
                'name',
                'cell',
                'email',
                'country_code',
                'country_iso_code',
              ],
              include: [
                {
                  model: DepartmentUsers,
                  where: department_id ? { id: department_id } : {},
                },
              ],
            },
            {
              model: EventContact,
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
                    WHERE "companies"."id" = "priority_guide_alerts->event_contact"."company_id"
                  )`),
                  'company_name',
                ],
              ],
              include: [
                {
                  model: Company,
                  attributes: [],
                },
              ],
            },
          ],
        },
      ],
      order: priorityGuideOrder(sort_column, order),
    });
  }

  async getPriorityGuideById(
    id: number,
    getpriorityGuideById?: GetPriorityGuideById,
  ) {
    /* Empty object because this api is using in alert
       service where we are not passing any query param  */
    const {
      is_key_contact,
      sort_column,
      order,
      page,
      page_size,
      keyword,
      all_users,
    } = getpriorityGuideById || {};
    let priorityGuideStaff;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    let staff;
    let allAlerts = [];

    if (all_users) {
      const users = await User.findAll({
        where: {
          ...priorityGuideByIdWhere(keyword),
          blocked_at: { [Op.eq]: null },
        },
        attributes: [
          'id',
          'first_name',
          'last_name',
          'name',
          'cell',
          'email',
          'country_code',
          'country_iso_code',
          [
            Sequelize.literal(`(
              SELECT ("department->company"."name") FROM "companies"
              WHERE "companies"."id" = "department"."company_id"
            )`),
            'company_name',
          ],
          [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
        ],
        include: priorityGuideByIdInclude(id, false),
      });

      const eventContacts = await EventContact.findAll({
        where: priorityGuideByIdWhere(keyword, true),
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
          'createdAt',
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
        include: priorityGuideByIdInclude(id, true),
      });

      allAlerts = [...users, ...eventContacts];
      // Sort the merged array by name in ascending order
      allAlerts.sort((a, b) => a.name.localeCompare(b.name));
    } else if (is_key_contact) {
      staff = await EventContact.findAndCountAll({
        where: priorityGuideByIdWhere(keyword, is_key_contact),
        attributes: ['id', 'createdAt'],
        include: priorityGuideByIdInclude(id, is_key_contact),
        subQuery: false,
        order: [['created_at', SortBy.DESC]],
        limit: _page_size || undefined,
        offset: _page_size * _page || undefined,
        distinct: true,
      });

      const userIds = staff.rows.map((data) => data.id);

      priorityGuideStaff = await EventContact.findAll({
        where: { id: { [Op.in]: userIds } },
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
          'createdAt',
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
        include: priorityGuideByIdInclude(id, is_key_contact),
        order: [[sort_column || 'createdAt', order || SortBy.DESC]],
      });
    } else {
      staff = await User.findAndCountAll({
        where: {
          ...priorityGuideByIdWhere(keyword),
          blocked_at: { [Op.eq]: null },
        },
        attributes: ['id', 'created_at'],
        include: priorityGuideByIdInclude(id, is_key_contact),
        order: [['created_at', SortBy.DESC]],
        limit: _page_size || undefined,
        offset: _page_size * _page || undefined,
        distinct: true,
        subQuery: false,
      });

      const usersIds = staff.rows.map((user) => user.get('id'));

      priorityGuideStaff = await User.findAll({
        where: { id: { [Op.in]: usersIds } },
        attributes: [
          'id',
          'first_name',
          'last_name',
          'name',
          'cell',
          'email',
          'country_code',
          'country_iso_code',
          [
            Sequelize.literal(`(
              SELECT ("department->company"."name") FROM "companies"
              WHERE "companies"."id" = "department"."company_id"
            )`),
            'company_name',
          ],
        ],
        include: priorityGuideByIdInclude(id, is_key_contact),
        order: [[sort_column || 'createdAt', order || SortBy.DESC]],
      });
    }

    return {
      data: all_users ? allAlerts : priorityGuideStaff,
      pagination: all_users
        ? calculatePagination(allAlerts?.length, 0, 1) //sending all data for all_users case and only sending count and page size and page are just dummy values
        : calculatePagination(staff?.count, page_size, page),
      count: all_users ? allAlerts?.length : staff?.count,
    };
  }

  async updatePriorityGuide(
    id: number,
    updatePriorityGuideDto: UpdatePriorityGuideDto,
  ) {
    let priorityKey = null;
    const { priority, event_id } = updatePriorityGuideDto;

    // fetching priority guide by it's ID and Event_id
    const priorityGuide = await PriorityGuide.findOne({
      where: { id, event_id },
      attributes: [
        'id',
        'description',
        'name',
        'scale_setting',
        [PriorityGuide.getPriorityNameByKey, 'priority'],
      ],
    });

    if (!priorityGuide)
      throw new NotFoundException(ERRORS.PRIORITY_GUIDE_NOT_FOUND);

    // Fetching Priority Key by Priority Name, because we are saving key in db
    if (priority) {
      priorityKey = Object.keys(PriorityGuideFilter).indexOf(
        priority.toUpperCase(),
      );
    }

    // if priority need to be change, then sending priority key in Updated object.
    const priorityUpdateObject = priority
      ? {
          ...updatePriorityGuideDto,
          priority: priorityKey,
        }
      : updatePriorityGuideDto;

    const updatedPriorityGuide =
      await priorityGuide.update(priorityUpdateObject);

    if (!updatedPriorityGuide)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    const count =
      await this.alertService.getAllIncidentTypeAndPriorityGuideCount(
        event_id,
        { useMaster: true },
      );

    const priorityGuideCount = await Alert.count({
      where: { alertable_id: id },
      useMaster: true,
    });

    sendUpdatedPriorityGuide(
      { priorityGuide: updatedPriorityGuide, priorityGuideCount, count },
      event_id,
      'update',
      SocketTypes.PRIORITY_GUIDE,
      false,
      this.pusherService,
    );

    return updatedPriorityGuide;
  }

  async updateScaleSetting(
    updatePriorityGuideScaleSetting: UpdatePriorityGuideScaleSettingDto,
  ) {
    const { event_id, scale_setting, updated_description } =
      updatePriorityGuideScaleSetting;
    await isEventExist(event_id);

    if (updated_description) {
      const keys = Object.keys(PriorityGuideMessages).filter(
        (key) => typeof key === 'string',
      );

      await Promise.all(
        keys.map(async (key, index) => {
          await PriorityGuide.update(
            { description: PriorityGuideMessages[key] },
            { where: { event_id, priority: index } },
          );
        }),
      );
    }

    await PriorityGuide.update(
      {
        scale_setting,
      },
      {
        where: { event_id },
      },
    );

    const updatedPriorityGuide = getAllPriorityGuideHelper(event_id, {
      useMaster: true,
    });

    const count =
      await this.alertService.getAllIncidentTypeAndPriorityGuideCount(
        event_id,
        { useMaster: true },
      );

    sendUpdatedPriorityGuide(
      { priorityGuide: updatedPriorityGuide, count },
      event_id,
      'update',
      SocketTypes.PRIORITY_GUIDE,
      false,
      this.pusherService,
    );

    return updatedPriorityGuide;
  }
}
