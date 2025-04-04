import { Response, Request } from 'express';
import moment from 'moment';
import {
  BulkCreateOptions,
  CreateOptions,
  DestroyOptions,
  Op,
  UpdateOptions,
} from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  Company,
  Department,
  DepartmentUsers,
  Event,
  EventDepartment,
  EventIncidentDivision,
  EventUser,
  Image,
  Incident,
  IncidentDepartmentUsers,
  IncidentDivision,
  IncidentType,
  Location,
  Scan,
  Task,
  User,
  UserCompanyRole,
  UserIncidentDivision,
  UserTask,
  UserToken,
  Vendor,
  VendorUsers,
} from '@ontrack-tech-group/common/models';
import {
  AdminRoles,
  AdminRolesIncludedTaskAdmin,
  CsvOrPdf,
  ERRORS,
  Editor,
  GlobalRoles,
  MESSAGES,
  Options,
  PolymorphicType,
  RESPONSES,
  RolesEnum,
  RolesNumberEnum,
  SortBy,
  UserAccess,
  UserStatuses,
  rails_webhook_url,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  createRandomNumberWithDigits,
  currentCompanies,
  getArrayInChunks,
  getCompanyScope,
  getEventForPdfs,
  getPageAndPageSize,
  getPageAndPageSizeWithDefault,
  getQueryListParam,
  getScopeAndCompanyIds,
  getSubCompaniesOfGlobalAdmin,
  hasUserPermission,
  isDepartmentExist,
  isEventExist,
  successInterceptorResponseFormat,
  throwCatchError,
  userRoleInclude,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  ChangeLogService,
  CommunicationService,
  PusherService,
  postRequest,
} from '@ontrack-tech-group/common/services';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { ImageService } from '@Modules/image/image.service';
import {
  RailsWebhookChannel,
  SocketTypes,
  _ERRORS,
  _MESSAGES,
  mailChimpUserRoles,
  userScanType,
} from '@Common/constants';
import { addUserToInProgressEvent, getCompanyParentId } from '@Common/helpers';
import { MailChimpService } from '@Common/services/mailchimp';
import { associateRegions } from '@Modules/user-companies/helpers';
import { AppService } from 'src/app.service';
import {
  EventUsersQueryParamsDto,
  CreateUserDto,
  UpdateUserDto,
  AssignDepartmentDivisionUserDto,
  StaffDetailQueryParamsDto,
  UploadStaffToDeparmentsDto,
  UploadStaffDto,
  AllUsersQueryParamsDto,
  UploadUserAttachmentDto,
  UsersLocationDto,
  CreateUserLocationDto,
  GetDepartmentsUsers,
  AssignUnassignEventDto,
  UpdateUserStatusDto,
  SelectedUsersCsvDto,
  UserEventsChangeLogsDto,
  UserStatusWebhookDto,
  AssignDepartmentWithEventDto,
  UpdateUserSettingsDto,
  EventUserDto,
  UpdateBulkUserStatusDto,
  EventUserMentionDto,
  DispatchStaffUsersDto,
  IncidentStaffDto,
} from './dto';
import {
  getEventUsersWhereFilter,
  checkCreateVendorDriver,
  moveStaffToAnotherCompanyAndDepartment,
  generateCsvOrPdfForStaffListing,
  isUserExist,
  checkUserAgainstEvent,
  getUserById,
  userCompanyData,
  filterUsersCompanyDataForAdminAndGlobalAdmin,
  createUpdateUserValidation,
  userIdsHelper,
  userIdsHelperForCount,
  userCompanyRoleData,
  getActiveUserCount,
  parseCsvAndSaveUsers,
  sendResponseForUploadedStaff,
  userByIdQueryAttributes,
  getQueryParamOrListParam,
  getActiveUserCountForMultipleIds,
  eventUsersWhere,
  updateSelfInfo,
  generatePdfForEventUsers,
  eventDataForPdf,
  getUserRecordWithDivisionArray,
  sendUserIncidentDivisionUpdate,
  sendMultipleUserIncidentDivisionUpdate,
  getAutoIncrementedEmail,
  getAutoIncrementedCell,
  associateMultipleEvents,
  usersAndEventsExist,
  sendUpdatedUserDivision,
  getAllEventUsersHelperV1,
  eventUserWhere,
  userEventListingOrder,
  eventUserMentionWhere,
  eventUserIdsattributes,
  userCompanyRoleForDispatchStaff,
  getDispatchStaffWehre,
  incidentStaffProccesedData,
  userCompanyRoleDataForIncidentStaff,
  userIncidentListingOrder,
} from './helper';
import { isEventDepartmentExist } from './query';

@Injectable()
export class UserService {
  constructor(
    private readonly changeLogService: ChangeLogService,
    private sequelize: Sequelize,
    private readonly httpService: HttpService,
    private readonly pusherService: PusherService,
    private readonly imageService: ImageService,
    private readonly mailChimpService: MailChimpService,
    private readonly configService: ConfigService,
    private readonly appService: AppService,
    private readonly communicationService: CommunicationService,
  ) {}

  async userStatusUpdateWebhook(userStatusUpdateDto: UserStatusWebhookDto) {
    const { user_id } = userStatusUpdateDto;
    const user = await User.findByPk(user_id, {
      attributes: [
        'id',
        'email',
        'name',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
      ],
    });

    if (!user) throw new NotFoundException(RESPONSES.notFound('User'));

    this.pusherService.updateUserStatus(user_id, user?.status.toString());

    return { message: 'Socket Has Been Triggered For Updating User Status' };
  }

  async createUser(body: CreateUserDto, currentUser: User) {
    const {
      event_id,
      department_id,
      vendor_id,
      cell,
      demo_user,
      role,
      images,
      division_ids,
      status,
      country_code,
      email,
      first_name,
      last_name,
      user_category,
      region_ids,
      reference_user,
      multiple_events_association,
      pin,
    } = body;

    let user: User;
    let company_id: number = body.company_id;
    let userCompany: UserCompanyRole;

    // checking event exist or not
    if (event_id) {
      const event = await isEventExist(event_id);
      company_id = event.company_id;
    }
    // Before creating a user associated with a company, it is necessary to verify if the user has access rights to this company.
    await getCompanyScope(currentUser, company_id);

    if (division_ids?.length && !event_id)
      throw new ForbiddenException(
        ERRORS.EVENT_ID_IS_REQUIRED_IF_USER_ASSOCIATED_WITH_PASSED_DIVISIONS_IDS,
      );

    await checkCreateVendorDriver(body, currentUser);

    // getting regions from validation function
    const { regions, userExistOtherCompany } = await createUpdateUserValidation(
      cell,
      country_code,
      role
        ? RolesNumberEnum[role.toUpperCase()]
        : RolesNumberEnum.REFERENCE_USER,
      company_id,
      department_id,
      region_ids,
      currentUser,
    );

    if (demo_user && !pin) body.pin = createRandomNumberWithDigits(4);

    if (reference_user) {
      body['email'] = await getAutoIncrementedEmail();
      body['country_code'] = '+1';
      body['cell'] = await getAutoIncrementedCell();
    }

    const transaction = await this.sequelize.transaction();

    try {
      const _userBody = {
        ...body,
        role: role
          ? RolesNumberEnum[role.toUpperCase()]
          : RolesNumberEnum.REFERENCE_USER,
        encrypted_password: '',
        status: status === 'available' ? 0 : 1,
        company_id,
      };

      if (userExistOtherCompany) {
        user = (
          await User.update(_userBody, {
            where: { id: userExistOtherCompany.id },
            returning: true,
            transaction,
          })
        )[1][0]; // on index 1, it get array of all changed rows. then getting first row using 0 index
      } else {
        user = await User.create(_userBody, { raw: true, transaction });
      }

      // creating a record in UserCompanyRole Table for multi-company functionality
      userCompany = await UserCompanyRole.create(
        {
          user_id: user.id,
          role_id: role
            ? RolesNumberEnum[role.toUpperCase()]
            : RolesNumberEnum.REFERENCE_USER,
          company_id,
          category: user_category,
        },
        {
          transaction,
          editor: { editor_id: currentUser.id, editor_name: currentUser.name }, // Custom field for hooks
        } as CreateOptions & { editor: Editor },
      );

      if (regions?.length)
        await associateRegions(
          userCompany.id,
          regions,
          false,
          currentUser,
          transaction,
        );

      // Create the user images
      images?.length &&
        (await Promise.all(
          images.map(
            async (image) =>
              await Image.create(
                {
                  url: image,
                  imageable_id: user.id,
                  imageable_type: PolymorphicType.USER,
                },
                { transaction },
              ),
          ),
        ));

      // Create user division if not exist
      division_ids?.length &&
        (await Promise.all(
          division_ids.map(
            async (divisionId) =>
              await UserIncidentDivision.findOrCreate({
                where: {
                  user_id: user.id,
                  incident_division_id: divisionId,
                  event_id,
                },
                transaction,
              }),
          ),
        ));

      // Update the Event user if not exist
      event_id &&
        (await EventUser.findOrCreate({
          where: { event_id, user_id: user.id },
          transaction,
        }));

      // If vendor exist against the target event then create the vendor user record
      if (event_id) {
        const vendor =
          currentUser['role'] === RolesEnum.VENDOR
            ? await Vendor.findOne({
                where: {
                  id: vendor_id,
                  company_id: currentUser['company_id'],
                },
                include: [
                  {
                    model: VendorUsers,
                    where: { user_id: currentUser.id },
                    required: true,
                  },
                ],
              })
            : null;

        if (vendor) {
          const vendorUser = (
            await VendorUsers.findOrCreate({
              where: event_id
                ? { user_id: user.id, event_id }
                : { user_id: user.id },
              transaction,
            })
          )[0];

          vendorUser.vendor_id = vendor.id;
          vendorUser.save();
        }
      }

      // If department exist against the provided departmentId then create department user if not exist
      if (department_id) {
        const department = department_id
          ? await Department.findOne({ where: { id: department_id } })
          : null;

        if (department) {
          //add user to all inprogress events of department
          await addUserToInProgressEvent(
            department_id,
            user.id,
            company_id,
            transaction,
          );

          await DepartmentUsers.create(
            {
              user_id: user.id,
              department_id,
            },
            {
              transaction,
              editor: {
                editor_id: currentUser.id,
                editor_name: currentUser.name,
              },
            } as CreateOptions & { editor: Editor },
          );
        }
      }

      if (multiple_events_association?.length) {
        await associateMultipleEvents(
          multiple_events_association,
          company_id,
          user.id,
          department_id,
          transaction,
        );
      }

      // Commit the all above transactions
      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ UserService ~ createUser ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    if (
      this.configService.get('ENV') === 'prod' &&
      this.configService.get('MAILCHIMP_DEPLOYMENT') === 'true' &&
      mailChimpUserRoles.includes(role) &&
      !user['demo_user']
    ) {
      // after creating a user in database, now adding this user in MailChimp Audience List
      await this.mailChimpService.addContact(
        email,
        first_name,
        last_name,
        user.id,
        company_id,
      );
    }

    const options = { useMaster: true };

    const socketUser = event_id
      ? await getUserById(user.id, event_id, null, options)
      : await this.getUserByIdMobile(user.id, currentUser, options);

    // This is for sending created users in sockets so newly created user can be visible by everyone on frontend real-time
    this.pusherService.sendUpdatedUser(socketUser, event_id);

    // On user creation, the department bucket count needs to be updated in real-time.
    this.pusherService.assignStaffToDepartmentAndDivision(
      MESSAGES.DEPARTMENT_ASSIGNED_SUCCESSFULLY,
      event_id,
    );

    return user;
  }

  async uploadStaffToDepartments(
    uploadStaffDto: UploadStaffToDeparmentsDto,
    currentUser: User,
    req: Request,
  ) {
    const { event_id, files } = uploadStaffDto;
    const response = [];

    const { name, company_name } = (await isEventExist(event_id)).toJSON();

    const department = await Department.findOne({
      where: { id: files[0]?.department_id },
      attributes: ['id', 'company_id'],
    });

    if (!department) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);

    for (const params of files) {
      response.push(
        await parseCsvAndSaveUsers(
          { ...params, event_id, division_id: null },
          department.company_id,
          this.httpService,
          this.sequelize,
          currentUser,
          this.appService,
        ),
      );
    }

    this.pusherService.assignStaffToDepartmentAndDivision(
      MESSAGES.DEPARTMENT_ASSIGNED_SUCCESSFULLY,
      event_id,
    );

    const webhookData = {
      body: {
        company_id: department.company_id,
        event_id,
      },
      channel_name: RailsWebhookChannel.UPLOAD_STAFF,
    };

    try {
      await postRequest(
        req.headers.authorization,
        this.httpService,
        webhookData,
        rails_webhook_url,
      );
    } catch (err) {
      console.log('🚀 ~ DepartmentService ~ err:', err);
    }

    return await sendResponseForUploadedStaff(
      response,
      this.communicationService,
      this.pusherService,
      currentUser,
      event_id,
      name,
      company_name,
    );
  }

  async uploadStaff(uploadStaffDto: UploadStaffDto, currentUser: User) {
    const { event_id } = uploadStaffDto;
    let response = null;

    const [companyId] = await withCompanyScope(currentUser, event_id);

    const { name, company_name } = (await isEventExist(event_id)).toJSON();

    response = await parseCsvAndSaveUsers(
      uploadStaffDto,
      companyId,
      this.httpService,
      this.sequelize,
      currentUser,
      this.appService,
    );

    return await sendResponseForUploadedStaff(
      [response],
      this.communicationService,
      this.pusherService,
      currentUser,
      event_id,
      name,
      company_name,
    );
  }

  async uploadUserAttachment(
    uploadUserAttachment: UploadUserAttachmentDto,
    user: User,
  ) {
    const { user_id, url, name } = uploadUserAttachment;

    await isUserExist(+user_id);

    // create image entry
    const createdImage = await this.imageService.createImage(
      +user_id,
      PolymorphicType.USER,
      url,
      name,
      user.id,
    );

    return createdImage;
  }

  async createUserLocation(
    createUserLocationDto: CreateUserLocationDto,
    user: User,
  ) {
    const { event_id, location, user_id } = createUserLocationDto;
    await withCompanyScope(user, event_id);

    const { id } = await checkUserAgainstEvent(user_id, event_id);

    const [_location, created] = await Location.findOrCreate({
      where: {
        locationable_id: id,
        locationable_type: PolymorphicType.USER,
      },
      defaults: {
        ...location,
        locationable_id: id,
        locationable_type: PolymorphicType.USER,
      },
    });

    if (!created) {
      await _location.update({ ...location });

      return { message: _MESSAGES.LOCATION_UPDATED_SUCCESSFULLY };
    }

    return { message: _MESSAGES.LOCATION_CREATED_SUCCESSFULLY };
  }

  async getUsersOfDepartments(
    getDepartmentsUsers: GetDepartmentsUsers,
    user: User,
  ) {
    const { event_id, department_ids, hide_upper_role, event_users } =
      getDepartmentsUsers;

    const [company_id] = await withCompanyScope(user, event_id);

    return await User.findAll({
      where: { blocked_at: { [Op.eq]: null } },
      attributes: [
        'id',
        'email',
        'name',
        'first_name',
        'last_name',
        'blocked_at',
        'demo_user',
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
      ],
      include: [
        {
          model: Department,
          where: { id: { [Op.in]: department_ids } },
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        event_users
          ? {
              model: EventUser,
              where: { event_id },
              required: true,
            }
          : null,
        hide_upper_role
          ? {
              model: UserCompanyRole,
              where: {
                company_id,
                role_id: { [Op.notIn]: [0, 26, 27, 28, 32, 33] }, // excluding upper roles
              },
              attributes: [],
            }
          : null,
      ].filter(Boolean),
    });
  }

  async assignDepartmentWithEvent(
    assignUserWithDepartment: AssignDepartmentWithEventDto,
    user: User,
  ) {
    const { user_id, department_id, event_id } = assignUserWithDepartment;

    await withCompanyScope(user, event_id);
    await isDepartmentExist(department_id);

    const transaction = await this.sequelize.transaction();

    try {
      await EventDepartment.findOrCreate({
        where: {
          department_id,
          event_id,
        },
        transaction,
      });

      await EventUser.findOrCreate({
        where: { event_id, user_id },
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ UserService ~ assignUserDepartment ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    try {
      this.pusherService.assignStaffToDepartmentAndDivision(
        MESSAGES.DEPARTMENT_ASSIGNED_SUCCESSFULLY,
        event_id,
      );
    } catch (err) {
      console.log(
        '🚀 ~ UserService ~ Pusher Service on Assign Department to Event:',
        err,
      );
    }

    return { message: _MESSAGES.ASSIGN_DEPARTMENT_WITH_EVENT };
  }

  async getUserAttachments(id: number) {
    await isUserExist(id);

    return this.imageService.getImages(id, PolymorphicType.USER);
  }

  async getEventUsersList(
    filters: EventUsersQueryParamsDto,
    user: User,
    req: Request,
    res: Response,
    workforceDepartment?: boolean,
  ) {
    const {
      department_id,
      event_id,
      eventUsers,
      division_id,
      na_division,
      csv_pdf,
      sort_column,
      order,
      page,
      page_size,
      division_ids,
      department_ids,
      file_name,
      keyword,
      available_staff,
    } = filters;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    let users: any;

    const [company_id] = await withCompanyScope(user, event_id);

    const _division_ids = getQueryParamOrListParam(division_id, division_ids);
    const _department_ids = getQueryParamOrListParam(
      department_id,
      department_ids,
    );

    if (workforceDepartment && !department_id) {
      throw new BadRequestException('Department ID is required');
    }

    if (na_division) {
      users = await User.findAndCountAll({
        where: getEventUsersWhereFilter(filters),
        attributes: ['id', 'name'],
        include: [
          {
            model: EventUser,
            where: { event_id },
            required: !!eventUsers,
            attributes: [],
          },
          {
            model: Department,
            where: department_id ? { id: { [Op.in]: _department_ids } } : {},
            attributes: [],
            through: { attributes: [] },
            required: true,
            include: [
              {
                model: Event,
                where: keyword ? { company_id } : { id: event_id },
                attributes: [],
                through: { attributes: [] },
                required: true,
              },
            ],
          },
          ...userCompanyRoleData(+user['role'], company_id),
        ],
        order: [['name', SortBy.ASC]],
        limit: _page_size || undefined,
        offset: _page_size * _page || undefined,
        distinct: true,
      });
    } else {
      users = await User.findAndCountAll({
        where: getEventUsersWhereFilter(filters),
        attributes: eventUserIdsattributes(available_staff),
        include: [
          ...(workforceDepartment
            ? [
                {
                  model: DepartmentUsers,
                  attributes: [],
                  where: {
                    department_id: { [Op.in]: _department_ids },
                  },
                },
                {
                  model: EventUser,
                  where: { event_id },
                  attributes: [],
                  required: !!eventUsers,
                },
                ...userCompanyRoleData(+user['role'], company_id),
              ]
            : [
                {
                  model: EventUser,
                  where: { event_id },
                  required: !!eventUsers,
                  attributes: [],
                },
                {
                  model: Department,
                  where: _department_ids?.length
                    ? { id: { [Op.in]: _department_ids } }
                    : {},
                  attributes: [],
                  through: { attributes: [] },
                  required: true,
                  include: [
                    {
                      model: Event,
                      where: keyword ? { company_id } : { id: event_id },
                      attributes: [],
                      through: { attributes: [] },
                      required: true,
                    },
                  ],
                },
                {
                  model: UserIncidentDivision,
                  where: {
                    ...(_division_ids?.length
                      ? {
                          incident_division_id: { [Op.in]: _division_ids },
                        }
                      : {}),
                  },
                  attributes: [],
                  required: !!_division_ids?.length,
                  include: [
                    {
                      model: IncidentDivision,
                      attributes: [],
                    },
                  ],
                },
                ...userCompanyRoleData(+user['role'], company_id),
              ]),

          // Conditionally add `available_staff` without causing undefined elements
          ...(available_staff
            ? [
                {
                  model: Scan,
                  where: { event_id, scan_type: { [Op.in]: userScanType } },
                  attributes: [
                    'incident_id',
                    [Scan.getFormattedScanTypeByKey, 'scan_type'],
                  ],
                  include: [
                    {
                      model: Incident,
                      as: 'dispatched_incident',
                      attributes: ['id'],
                      include: [
                        {
                          model: IncidentType,
                          attributes: ['id', 'name'],
                        },
                      ],
                    },
                  ],
                  required: false,
                  order: [['createdAt', SortBy.DESC]],
                  limit: 1,
                },
              ]
            : []),
        ].filter(Boolean), // Removes undefined/null values
        order: available_staff
          ? userEventListingOrder(sort_column, order, available_staff)
          : [['name', SortBy.ASC]], //available staff is for sorting user by deparment name and then by status in dispatch center
        limit: _page_size || undefined,
        offset: _page_size * _page || undefined,
        distinct: true,
      });
    }
    const userIds = users.rows.map((user) => user.id);

    const records = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: [
        'id',
        'email',
        'name',
        'cell',
        'employee',
        'first_name',
        'last_name',
        'active',
        'last_scan',
        'country_code',
        'country_iso_code',
        'created_at',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(`"images"."url"`), 'image_url'],
        [
          Sequelize.literal(
            `"user_incident_divisions->incident_division"."name"`,
          ),
          'division_name',
        ],
        [
          Sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "event_users"
              WHERE "user_id" = "User"."id" AND "event_id" = ${event_id}
            )
          )`),
          'is_event_assigned',
        ],
        [Sequelize.literal(`"last_scan"->>'incident_id'`), 'incident_id'],
        [Sequelize.literal(`"last_scan"->>'scan_type'`), 'scan_type'],
        ...isEventDepartmentExist(event_id),
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
        [
          Sequelize.literal(`"users_companies_roles->company"."name"`),
          'company_name',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT (*)::INTEGER FROM "user_incident_divisions"
             WHERE "user_incident_divisions"."user_id" = "User"."id"
             AND "user_incident_divisions"."event_id" = ${event_id}
          )`),
          'incident_counts',
        ],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Location,
          attributes: ['id', 'longitude', 'latitude', 'event_id', 'updated_at'],
          where: { event_id },
          required: false,
        },
        {
          model: Department,
          where: _department_ids?.length
            ? { id: { [Op.in]: _department_ids } }
            : {},
          attributes: [],
          through: { attributes: [] },
          include: [
            {
              model: Event,
              where: keyword ? { company_id } : { id: event_id },
              attributes: [],
              through: { attributes: [] },
            },
          ],
        },
        {
          model: UserIncidentDivision,
          where: {
            ...(_division_ids?.length
              ? {
                  incident_division_id: { [Op.in]: _division_ids },
                }
              : {}),
          },
          attributes: ['id'],
          required: !!_division_ids?.length,
          include: [
            {
              model: IncidentDivision,
              where: { company_id },
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Scan,
          where: { event_id, scan_type: { [Op.in]: userScanType } },
          attributes: [
            'incident_id',
            [Scan.getFormattedScanTypeByKey, 'scan_type'],
          ],
          include: [
            {
              model: Incident,
              as: 'dispatched_incident',
              attributes: ['id'],
              include: [
                {
                  model: IncidentType,
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
          required: false,
          order: [['createdAt', SortBy.DESC]],
          limit: 1,
        },
        ...userRoleInclude(company_id),
      ],
      order: userEventListingOrder(sort_column, order, available_staff),
      subQuery: false,
    });

    if (csv_pdf === CsvOrPdf.CSV) {
      return await generateCsvOrPdfForStaffListing(
        filters,
        records,
        req,
        res,
        this.httpService,
      );
    }

    // Count of users who are part of current event
    const activeUserCount = await getActiveUserCountForMultipleIds(
      event_id,
      user,
      company_id,
      filters,
      _division_ids,
      _department_ids,
      null,
    );

    const event = await eventDataForPdf(event_id);
    const userData = await getUserRecordWithDivisionArray(records);

    if (csv_pdf === CsvOrPdf.PDF) {
      return await generatePdfForEventUsers(
        userData,
        event,
        file_name,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        counts: {
          activeUserCount,
          division_lock_service: event?.division_lock_service,
        },
        data: userData,
        pagination: calculatePagination(users.count, _page_size, _page),
      }),
    );
  }

  async getEventUsersListV1(
    filters: EventUsersQueryParamsDto,
    user: User,
    req: Request,
    res: Response,
    workforceDepartment?: boolean,
  ) {
    const { department_id, csv_pdf, page, page_size, file_name } = filters;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    if (workforceDepartment && !department_id) {
      throw new BadRequestException('Department ID is required');
    }

    const { users, event, activeUserCount, count } =
      await getAllEventUsersHelperV1(filters, _page, _page_size, user);

    if (csv_pdf === CsvOrPdf.CSV) {
      return await generateCsvOrPdfForStaffListing(
        filters,
        users,
        req,
        res,
        this.httpService,
      );
    }

    if (csv_pdf === CsvOrPdf.PDF) {
      return await generatePdfForEventUsers(
        users,
        event,
        file_name,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        counts: {
          activeUserCount,
          division_lock_service: event?.division_lock_service,
        },
        data: users,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getAllUsers(
    filters: AllUsersQueryParamsDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { page, page_size, csv_pdf, sort_column, order, company_id, role } =
      filters;

    const role_id = role && RolesNumberEnum[role.toUpperCase()];

    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    const { companyIds } = await getScopeAndCompanyIds(user);

    if (
      !companyIds.includes(company_id) &&
      company_id &&
      !user['is_super_admin'] &&
      !user['is_ontrack_manager']
    ) {
      throw new ForbiddenException(
        _ERRORS.YOU_DONT_HAVE_ACCESS_TO_THIS_COMPANY,
      );
    }

    const users = await User.findAndCountAll({
      where: {
        id: {
          [Op.in]: await userIdsHelper(filters, companyIds, user),
        },
      },
      attributes: ['id', 'name'],
      limit: !page_size && csv_pdf ? undefined : _page_size,
      offset: !page && csv_pdf ? undefined : _page_size * _page,
      order: [
        Sequelize.literal(`${sort_column || 'name'} ${order || SortBy.ASC}`),
      ],
    });
    const userIds = users.rows.map((user) => user.id);

    const usersCount = await User.findAndCountAll({
      where: {
        id: {
          [Op.in]: await userIdsHelperForCount(filters, companyIds, user),
        },
      },
      attributes: ['id', 'name'],
    });
    const userCountIds = usersCount.rows.map((user) => user.id);

    const records = await User.findAll({
      where: filterUsersCompanyDataForAdminAndGlobalAdmin(
        userIds,
        companyIds,
        user,
      ),
      attributes: [
        'id',
        'email',
        'name',
        'first_name',
        'last_name',
        'cell',
        'country_code',
        'country_iso_code',
        'pin',
        [
          Sequelize.literal(
            '(CASE WHEN "User"."mfa_token" IS NOT NULL THEN TRUE ELSE FALSE END)',
          ),
          'mfa',
        ],
        'blocked_at',
        'demo_user',
        'reference_user',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [
          Sequelize.literal(`"users_companies_roles->company"."name"`),
          'company_name',
        ],
        [Sequelize.literal(`"users_companies_roles"."role_id"`), 'role_id'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [
          Sequelize.literal(
            `"user_incident_divisions->incident_division"."name"`,
          ),
          'division_name',
        ],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 0
            )
          `),
          'is_super_admin',
        ],
      ],
      include: [
        userCompanyData, // return user company information
        {
          model: Department,
          attributes: [],
          where: {
            company_id: {
              [Op.eq]: Sequelize.literal(
                '"users_companies_roles"."company_id"',
              ),
            },
          },
          required: false,
        },
        {
          model: UserIncidentDivision,
          attributes: ['id'],
          include: [
            {
              model: IncidentDivision,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [
        Sequelize.literal(`${sort_column || 'name'} ${order || SortBy.ASC}`),
        company_id
          ? [
              Sequelize.literal(
                `CASE WHEN "users_companies_roles"."company_id" = ${company_id} THEN 0 ELSE 1 END`,
              ),
              SortBy.ASC,
            ]
          : role_id
            ? [
                Sequelize.literal(
                  `CASE WHEN "users_companies_roles"."role_id" = ${role_id} THEN 0 ELSE 1 END`,
                ),
                SortBy.ASC,
              ]
            : [
                { model: UserCompanyRole, as: 'users_companies_roles' },
                'created_at',
                SortBy.DESC,
              ],
      ],
      subQuery: false,
    });

    const userStatusCount = await User.findAll({
      where: { id: { [Op.in]: userCountIds } },
      attributes: ['blocked_at'],
    });

    const blocked_users = userStatusCount.filter(
      (user) => user.blocked_at,
    ).length;

    const active_users = userStatusCount.filter(
      (user) => !user.blocked_at,
    ).length;

    if (csv_pdf) {
      return await generateCsvOrPdfForStaffListing(
        filters,
        records,
        req,
        res,
        this.httpService,
        true,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: records
          .map((row) => row.get({ plain: true }))
          .map((user) => {
            user.divisions = user.user_incident_divisions.map((division) => ({
              ...division.incident_division,
            }));
            user['associatedCompaniesCount'] =
              user?.users_companies_roles?.length;

            delete user.user_incident_divisions;
            return user;
          }),
        pagination: calculatePagination(users.count, _page_size, _page),
        userStatusCount: { active_users, blocked_users },
      }),
    );
  }

  async getAllEventUsers(eventUserDto: EventUserDto, user: User) {
    const {
      event_id,
      department_id,
      keyword,
      all_roles,
      global_roles,
      incident_division_id,
    } = eventUserDto;

    const { company_id } = await isEventExist(event_id);

    const companyId: number[] = [company_id];

    if (global_roles) {
      const parentCompany = await getCompanyParentId(company_id);

      if (parentCompany) companyId.push(parentCompany.parent_id);
    }

    return await User.findAll({
      where: eventUserWhere(keyword, global_roles, user),
      attributes: [
        'id',
        'name',
        [Sequelize.literal(`"department"."id"`), 'department_id'],
      ],
      include: [
        {
          model: UserCompanyRole,
          where: {
            company_id: { [Op.in]: companyId },
            ...(global_roles
              ? {
                  role_id: {
                    [Op.in]: [...GlobalRoles, ...AdminRolesIncludedTaskAdmin],
                  },
                } // Include global roles
              : all_roles
                ? {}
                : { role_id: { [Op.notIn]: [0, 26, 27, 28, 32, 33] } }), // Exclude upper roles
          },
          attributes: [],
        },
        {
          model: Event,
          as: 'events',
          where: { id: event_id },
          attributes: [],
          through: { attributes: [] },
          required: !global_roles,
        },
        {
          model: Department,
          where: department_id ? { id: department_id } : {},
          attributes: [],
          through: { attributes: [] },
          required: !global_roles,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: !global_roles,
            },
          ],
        },
        {
          model: UserIncidentDivision,
          where: {
            ...(incident_division_id
              ? {
                  incident_division_id,
                }
              : {}),
            ...{ event_id: event_id },
          },
          attributes: [],
          required: !!incident_division_id,
        },
      ],
    });
  }

  async getAllUsersForMentionInEventPlan(
    eventUserMentionDto: EventUserMentionDto,
    user: User,
  ) {
    const { event_id, keyword } = eventUserMentionDto;

    const { company_id } = await isEventExist(event_id);

    const companyId: number[] = [company_id];

    const parentCompany = await getCompanyParentId(company_id);

    if (parentCompany) companyId.push(parentCompany.parent_id);

    return await User.findAll({
      where: eventUserMentionWhere(keyword, user),
      attributes: [
        'id',
        'name',
        [Sequelize.literal(`"department"."id"`), 'department_id'],
      ],
      include: [
        {
          model: UserCompanyRole,
          where: {
            company_id: { [Op.in]: companyId },
            role_id: {
              [Op.in]: [...GlobalRoles, ...AdminRoles],
            },
          },
          attributes: [],
        },
        {
          model: Event,
          as: 'events',
          where: { id: event_id },
          attributes: [],
          through: { attributes: [] },
          required: false,
        },
        {
          model: Department,
          attributes: [],
          through: { attributes: [] },
          required: false,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: false,
            },
          ],
        },
      ],
    });
  }

  async getFilteredUsers(
    filters: EventUsersQueryParamsDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const {
      current_department_id,
      page,
      page_size,
      eventUsers,
      event_id,
      department_id,
      division_id,
      sort_column,
      order,
      current_division_id,
    } = filters;
    let alreadyAddedUsers = [];

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const { company_id } = await isEventExist(event_id);

    if (current_department_id) {
      alreadyAddedUsers = (
        await DepartmentUsers.findAll({
          where: { department_id: current_department_id },
          attributes: ['user_id'],
        })
      ).map((depUser) => depUser.user_id);
    }

    if (current_division_id) {
      alreadyAddedUsers = (
        await UserIncidentDivision.findAll({
          where: { incident_division_id: current_division_id },
          attributes: ['user_id'],
        })
      ).map((divisionUser) => divisionUser.user_id);
    }

    const users = await User.findAndCountAll({
      where: getEventUsersWhereFilter(filters, alreadyAddedUsers),
      attributes: ['id', 'name'],
      include: [
        {
          model: EventUser,
          where: { event_id },
          required: !!eventUsers,
          attributes: [],
        },
        ...userCompanyRoleData(+user['role'], company_id),
        {
          model: Department,
          where: department_id ? { id: department_id } : {},
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        {
          model: UserIncidentDivision,
          where: {
            ...(division_id
              ? {
                  incident_division_id: division_id,
                }
              : {}),
            ...{ event_id: event_id },
          },
          attributes: [],
          required: !!division_id,
          include: [
            {
              model: IncidentDivision,
              attributes: [],
            },
          ],
        },
      ],
      order: [['name', SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      distinct: true,
    });

    const userIds = users.rows.map((user) => user.id);

    const records = await User.findAll({
      where: { id: { [Op.in]: userIds } },
      attributes: [
        'id',
        'email',
        'name',
        'cell',
        'employee',
        'first_name',
        'last_name',
        'active',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(`"images"."url"`), 'image_url'],
        [
          Sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "event_users"
              WHERE "user_id" = "User"."id" AND "event_id" = ${event_id}
            )
          )`),
          'is_event_assigned',
        ],
        'country_code',
        'country_iso_code',
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
        ...isEventDepartmentExist(event_id),
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Location,
          attributes: ['id', 'longitude', 'event_id', 'latitude', 'updated_at'],
          where: { event_id },
          required: false,
        },
        {
          model: Department,
          where: department_id ? { id: department_id } : {},
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        {
          model: IncidentDivision,
          where: {
            ...(division_id
              ? {
                  incident_division_id: division_id,
                }
              : {}),
          },
          through: { attributes: [] },
          attributes: ['id', 'name'],
          required: false,
          include: [
            {
              model: EventIncidentDivision,
              where: {
                event_id,
              },
              attributes: [],
            },
          ],
        },
        ...userRoleInclude(company_id),
      ],
      order: [
        Sequelize.literal(`${sort_column || 'name'} ${order || SortBy.ASC}`),
        [{ model: Image, as: 'images' }, 'primary', 'DESC'],
      ],
      subQuery: false,
    });

    if (filters.csv_pdf) {
      return await generateCsvOrPdfForStaffListing(
        filters,
        records,
        req,
        res,
        this.httpService,
      );
    }

    // Count of users who are part of current event
    const activeUserCount = await getActiveUserCount(
      event_id,
      user,
      company_id,
      filters,
      department_id,
      division_id,
      alreadyAddedUsers,
    );

    return res.send(
      successInterceptorResponseFormat({
        counts: { activeUserCount },
        data: records
          .map((row) => row.get({ plain: true }))
          .map((user) => {
            user.divisions = user.incident_divisions.map((division) => ({
              ...division,
            }));
            delete user.incident_divisions;
            return user;
          }),
        pagination: calculatePagination(users.count, page_size, page),
      }),
    );
  }

  async getUsersLocation(usersLocationDto: UsersLocationDto, user: User) {
    const { department_id, event_id } = usersLocationDto;
    const [company_id] = await withCompanyScope(user, event_id);

    // if user is not a super_admin, getting company_id from headers and checking is this user authorized
    // if user is super_admin, getting company_id from current event
    const _company_id =
      !user['is_super_admin'] && !user['is_ontrack_manager']
        ? user['company_id']
        : company_id;

    const users = await User.findAll({
      where: { company_id: _company_id, blocked_at: { [Op.eq]: null } },
      attributes: {
        exclude: ['updatedAt'],
        include: [[Sequelize.literal(`"images"."url"`), 'image_url']],
      },
      include: [
        {
          model: Event,
          where: { id: event_id },
          attributes: [],
          as: 'events',
        },
        {
          model: Location,
          attributes: {
            exclude: ['locationable_id', 'locationable_type', 'createdAt'],
          },
          where: { event_id },
          required: false,
        },
        {
          model: Image,
          attributes: [],
        },
        {
          model: Department,
          where: department_id ? { id: department_id } : null,
          attributes: {
            exclude: ['updatedAt', 'createdAt', 'company_id', 'event_id'],
          },
          through: { attributes: [] },
        },
      ],
    });
    if (!users.length)
      throw new NotFoundException(
        RESPONSES.notFound('Users') + 'for this Event',
      );

    return users
      .map((row) => row.get({ plain: true }))
      .map((user) => {
        return {
          ...user,
          department: !user.department?.length ? null : user.department[0],
          location: user.location || null,
        };
      });
  }

  async getUserEventChangelog(
    userEventsChangeLogsDto: UserEventsChangeLogsDto,
  ) {
    const { user_id, page, page_size } = userEventsChangeLogsDto;
    await isUserExist(user_id);

    const changeLogs = await this.changeLogService.getChangeLogs({
      id: user_id,
      types: [PolymorphicType.EVENT_USER],
      page,
      page_size,
    });

    return changeLogs;
  }

  async getUserChangelogs(id: number, paginationDto: PaginationDto) {
    const { page, page_size } = paginationDto;

    // checking if user exist or not
    await isUserExist(id);

    const changeLogs = await this.changeLogService.getChangeLogs({
      id,
      types: [
        PolymorphicType.EVENT_USER,
        PolymorphicType.USER_COMPANY_ROLE,
        PolymorphicType.USER,
      ],
      page,
      page_size,
    });

    return changeLogs;
  }

  async getSelectedUserCsvPdf(
    selectedUserCsv: SelectedUsersCsvDto,
    req: Request,
    res: Response,
  ) {
    const { user_ids, event_id, csv_pdf, file_name } = selectedUserCsv;

    const { company_id } = await isEventExist(event_id);

    const users = await User.findAll({
      where: { id: { [Op.in]: user_ids }, blocked_at: { [Op.eq]: null } },
      attributes: [
        'id',
        'email',
        'name',
        'cell',
        'employee',
        'first_name',
        'last_name',
        'active',
        'country_code',
        'country_iso_code',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(`"images"."url"`), 'image_url'],
        [
          Sequelize.literal(`"users_companies_roles->company"."name"`),
          'company_name',
        ],
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Location,
          attributes: ['id', 'longitude', 'event_id', 'latitude', 'updated_at'],
          where: { event_id },
          required: false,
        },
        {
          model: Department,
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        {
          model: UserIncidentDivision,
          attributes: ['id'],
          required: false,
          include: [
            {
              model: IncidentDivision,
              where: { company_id },
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Scan,
          where: { event_id, scan_type: { [Op.in]: userScanType } },
          attributes: [
            'incident_id',
            [Scan.getFormattedScanTypeByKey, 'scan_type'],
          ],
          include: [
            {
              model: Incident,
              as: 'dispatched_incident',
              attributes: ['id'],
              include: [
                {
                  model: IncidentType,
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
          required: false,
          order: [['createdAt', SortBy.DESC]],
          limit: 1,
        },
        ...userRoleInclude(company_id),
      ],
      order: [['name', SortBy.ASC]],
      subQuery: false,
    });

    if (csv_pdf === CsvOrPdf.CSV) {
      return await generateCsvOrPdfForStaffListing(
        selectedUserCsv,
        users,
        req,
        res,
        this.httpService,
        true,
      );
    }

    const event = await eventDataForPdf(event_id);

    const userData = await getUserRecordWithDivisionArray(users);

    if (csv_pdf === CsvOrPdf.PDF) {
      return await generatePdfForEventUsers(
        userData,
        event,
        file_name,
        req,
        res,
        this.httpService,
      );
    }
  }

  async getUnassignedDivisionUsersList(
    filters: EventUsersQueryParamsDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const {
      department_id,
      event_id,
      division_id,
      csv_pdf,
      sort_column,
      order,
      page,
      page_size,
      eventUsers,
    } = filters;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const { company_id } = await isEventExist(event_id);

    const users = await User.findAll({
      where: getEventUsersWhereFilter(filters),
      attributes: ['id'],
      include: [
        {
          model: EventUser,
          where: { event_id },
          attributes: ['id'],
          required: !!eventUsers,
        },
        {
          model: Department,
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        {
          model: UserIncidentDivision,
          where: {
            event_id,
          },
          attributes: ['id'],
          required: false,
        },
        {
          model: UserCompanyRole,
          where: {
            role_id: {
              [Op.notIn]: [
                RolesNumberEnum.SUPER_ADMIN,
                RolesNumberEnum.DRIVER,
                RolesNumberEnum.ONTRACK_MANAGER,
              ],
            },
          },
          attributes: [],
        },
      ],
    });

    const unlinkedUsers = users.filter(
      (record) => record.user_incident_divisions.length === 0,
    );

    const userIds = unlinkedUsers.map((data) => data.id);

    const records = await User.findAndCountAll({
      where: { id: { [Op.in]: userIds } },
      attributes: [
        'id',
        'email',
        'name',
        'cell',
        'employee',
        'first_name',
        'last_name',
        'active',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(`"images"."url"`), 'image_url'],
        [
          Sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "event_users"
              WHERE "user_id" = "User"."id" AND "event_id" = ${event_id}
            )
          )`),
          'is_event_assigned',
        ],
        'country_code',
        'country_iso_code',
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: Location,
          attributes: ['id', 'longitude', 'event_id', 'latitude', 'updated_at'],
          where: { event_id },
          required: false,
        },
        {
          model: Department,
          where: department_id ? { id: department_id } : {},
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        ...userRoleInclude(company_id),
      ],
      order: [
        Sequelize.literal(`${sort_column || 'name'} ${order || SortBy.ASC}`),
      ],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      subQuery: false,
    });

    const { rows, count } = records;

    if (csv_pdf) {
      return await generateCsvOrPdfForStaffListing(
        filters,
        rows,
        req,
        res,
        this.httpService,
      );
    }
    // Count of users who are part of current event

    const activeUserCount = await User.count({
      where: {
        [Op.and]: [
          getEventUsersWhereFilter(filters),
          { id: { [Op.in]: userIds } },
        ],
      },
      include: [
        {
          model: EventUser,
          where: { event_id },
          required: true,
          attributes: [],
        },
        ...userCompanyRoleData(+user['role'], company_id),
        {
          model: Department,
          where: department_id ? { id: department_id } : {},
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        {
          model: UserIncidentDivision,
          where: {
            ...(division_id
              ? {
                  incident_division_id: division_id,
                }
              : {}),
            event_id,
          },
          attributes: [],
          required: !!division_id,
          include: [
            {
              model: IncidentDivision,
              attributes: [],
            },
          ],
        },
      ],
      distinct: true,
    });

    return res.send(
      successInterceptorResponseFormat({
        counts: { activeUserCount: activeUserCount || 0 },
        data: rows,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getIncidentDivisions(user_id: number, event_id?: number) {
    // handling optional event_id
    const _where = { user_id };
    if (event_id) _where['event_id'] = event_id;

    const userIncidentDivision = await UserIncidentDivision.findAll({
      where: _where,
      attributes: ['incident_division_id'],
      group: ['incident_division_id'], // Group by incident_division_id to get unique records
    });

    const userIncidentDivisionIds = userIncidentDivision.map(
      (incident) => incident.incident_division_id,
    );

    return userIncidentDivisionIds;
  }
  // this api is created to get only required data for dispatch staff against incident in dispatch center dropdown
  async getStaffForDispatch(
    dispatchUsersQuery: DispatchStaffUsersDto,
    user: User,
  ) {
    const {
      department_id,
      department_ids,
      event_id,
      page,
      page_size,
      keyword,
      sort_column,
      order,
    } = dispatchUsersQuery;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    let departmentIds: number[];

    const [company_id] = await withCompanyScope(user, event_id);

    if (department_id || department_ids)
      departmentIds = getQueryListParam(department_id || department_ids);

    const users = await User.findAndCountAll({
      where: getDispatchStaffWehre(keyword),
      attributes: [
        'id',
        'name',
        'first_name',
        'last_name',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
      ],
      include: [
        {
          model: EventUser,
          where: { event_id },
          required: true,
          attributes: [],
        },
        {
          model: Department,
          where: departmentIds?.length
            ? { id: { [Op.in]: departmentIds } }
            : {},
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        ...userCompanyRoleForDispatchStaff(company_id),
      ],
      order: [[sort_column || 'name', order || SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      distinct: true,
    });

    const { rows, count } = users;

    const transformedData = rows.map((item) => {
      const plainItem = item.get({ plain: true }); // Convert Sequelize instance to plain object
      return {
        ...plainItem,
        department_id: plainItem.department
          ? plainItem.department[0]?.id
          : null,
        department_name: plainItem.department
          ? plainItem.department[0]?.name
          : null,
        department: plainItem.department ? plainItem.department[0] : null,
      };
    });

    return {
      data: transformedData,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async getIncidentStaff(filters: IncidentStaffDto, user: User, res: Response) {
    const {
      event_id,
      sort_column,
      order,
      page,
      page_size,
      division_ids,
      department_ids,
    } = filters;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    let departmentIds: number[];
    let divisionIds: number[];

    const [company_id, division_lock_service] = await withCompanyScope(
      user,
      event_id,
    );

    if (department_ids) departmentIds = getQueryListParam(department_ids);

    if (division_ids) divisionIds = getQueryListParam(division_ids);

    const users = await User.findAndCountAll({
      where: getEventUsersWhereFilter(
        filters as unknown as EventUsersQueryParamsDto,
      ),
      attributes: [
        'id',
        'email',
        'name',
        'first_name',
        'last_name',
        'last_scan',
        'cell',
        'created_at',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
      ],
      include: [
        {
          model: EventUser,
          where: { event_id },
          attributes: [],
        },
        {
          model: Department,
          where: {
            ...(departmentIds?.length
              ? {
                  id: { [Op.in]: departmentIds },
                }
              : {}),
          },
          attributes: ['id', 'name'],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
            },
          ],
        },
        {
          model: UserIncidentDivision,
          where: {
            ...(divisionIds?.length
              ? {
                  incident_division_id: { [Op.in]: divisionIds },
                }
              : {}),
          },
          attributes: ['id'],
          required: !!divisionIds?.length,
          include: [
            {
              model: IncidentDivision,
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Location,
          attributes: ['id', 'longitude', 'latitude', 'event_id', 'updated_at'],
          where: { event_id },
          required: false,
        },
        {
          model: IncidentDepartmentUsers,
          attributes: ['id'],
        },
        {
          model: Scan,
          where: { event_id, scan_type: { [Op.in]: userScanType } },
          attributes: [
            'incident_id',
            [Scan.getFormattedScanTypeByKey, 'scan_type'],
          ],
          include: [
            {
              model: Incident,
              as: 'dispatched_incident',
              attributes: ['id'],
              include: [
                {
                  model: IncidentType,
                  as: 'incident_types',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
          required: false,
          order: [['createdAt', SortBy.DESC]],
          limit: 1,
        },
        ...userCompanyRoleDataForIncidentStaff(+user['role'], company_id),
      ],
      order: userIncidentListingOrder(sort_column, order),
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      distinct: true,
    });

    const { rows, count } = users;

    // function to get mapped data for users
    const userDepartmentData = incidentStaffProccesedData(rows);

    return res.send(
      successInterceptorResponseFormat({
        counts: {
          division_lock_service,
        },
        data: userDepartmentData,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async getUserMapServices(
    id: number,
    query: StaffDetailQueryParamsDto,
    user: User,
    res: Response,
    req: Request,
  ) {
    const { event_id, pdf, file_name } = query;

    const [company_id] = await withCompanyScope(user, event_id);
    const userMapInfo = await User.findOne({
      where: { id },
      attributes: [
        'id',
        'name',
        'email',
        'cell',
        'country_code',
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"companies"."name"`), 'company_name'],
        [Sequelize.literal(`"users_companies_roles->role"."name"`), 'role'],
      ],
      include: [
        {
          model: Company,
          where: { id: company_id },
          attributes: [],
        },
        {
          model: Department,
          attributes: [],
          through: { attributes: [] },
          required: true,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
              required: true,
            },
          ],
        },
        {
          model: UserIncidentDivision,
          attributes: ['id'],
          required: false,
          include: [
            {
              model: IncidentDivision,
              where: { company_id },
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Incident,
          where: { event_id },
          through: {
            attributes: [],
          },
          attributes: [
            'id',
            [Incident.getStatusNameByKeyForInclude, 'status'],
            [Incident.getPriorityNameByKeyNewMappingForInclude, 'priority'],
            [
              Sequelize.literal(`"incidents->incident_types"."name"`),
              'incident_type',
            ],
            'created_at',
            'logged_date_time',
          ],
          required: false,
          include: [
            {
              model: IncidentType,
              attributes: [],
            },
          ],
        },
        {
          model: Task,
          attributes: ['id', 'name', 'created_at', 'deadline', 'status'],
          where: { event_id },
          through: {
            attributes: [],
          },
          required: false,
          include: [
            {
              model: UserTask,
              where: { user_id: id },
              attributes: [],
            },
          ],
        },
        ...userRoleInclude(company_id),
      ],
    });

    const userIncidentCount = await Incident.count({
      where: {
        event_id,
      },
      include: [
        {
          model: IncidentDepartmentUsers,
          where: { user_id: id },
        },
      ],
    });

    const userTaskCount = await Task.count({
      where: {
        event_id,
      },
      include: [
        {
          model: UserTask,
          where: { user_id: id },
        },
      ],
    });

    const event = await getEventForPdfs(event_id, this.sequelize);

    if (pdf === CsvOrPdf.PDF) {
      return await generatePdfForEventUsers(
        userMapInfo,
        event,
        file_name,
        req,
        res,
        this.httpService,
        true,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        counts: { userIncidentCount, userTaskCount },
        data: userMapInfo,
      }),
    );
  }

  async getAllUserEvents(id: number, company_id: number) {
    const _where = company_id ? { company_id } : {};

    return await Event.findAll({
      attributes: ['id', 'name', 'company_id'],
      where: _where,
      include: [
        {
          model: User,
          as: 'users',
          attributes: [],
          where: { id },
          through: { attributes: [] },
        },
      ],
    });
  }

  async getUserById(id: number, query: StaffDetailQueryParamsDto, user: User) {
    const { event_id } = query;

    const currentCompaniesIds = await currentCompanies(user);

    const where = { id };

    const [company_id] = await withCompanyScope(user, event_id);

    if (
      user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
      user['role'] !== RolesNumberEnum.ONTRACK_MANAGER
    )
      where['$users_companies_roles.company_id$'] = {
        [Op.in]: currentCompaniesIds,
      };

    const userDetail = await User.findOne({
      where,
      attributes: [
        'id',
        'email',
        'name',
        'cell',
        'employee',
        'first_name',
        'last_name',
        'active',
        'app_version',
        'demo_user',
        'device_model',
        'employee',
        'blocked_at',
        'message_service',
        'pin',
        'reference_user',
        'date_format',
        'time_format',
        'temperature_format',
        'language_code',
        [
          Sequelize.literal(
            '(CASE WHEN "User"."mfa_token" IS NOT NULL THEN TRUE ELSE FALSE END)',
          ),
          'mfa',
        ],
        'country_code',
        'country_iso_code',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(`"images"."url"`), 'image_url'],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 0
            )
          `),
          'is_super_admin',
        ],
        ...isEventDepartmentExist(event_id),
        ...userByIdQueryAttributes(company_id, event_id),
      ],
      include: [
        {
          model: Image,
          attributes: [
            'id',
            'name',
            'url',
            'createdAt',
            'thumbnail',
            [Sequelize.literal(`"images->created_by"."name"`), 'createdBy'],
          ],
          include: [
            {
              model: User,
              as: 'created_by',
              attributes: [],
            },
          ],
        },
        {
          model: Location,
          attributes: ['id', 'longitude', 'latitude', 'event_id', 'updated_at'],
          where: { event_id },
          required: false,
        },
        {
          model: Event,
          as: 'events',
          attributes: ['id', 'name', 'active'],
          through: { attributes: [] },
          where: { id: event_id },
        },
        {
          model: Department,
          attributes: [],
          through: { attributes: [] },
          required: false,
          include: [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
              through: { attributes: [] },
            },
          ],
        },
        {
          model: UserIncidentDivision,
          attributes: ['id'],
          required: false,
          include: [
            {
              model: IncidentDivision,
              where: {
                company_id,
              },
              attributes: ['id', 'name'],
            },
          ],
        },
        userCompanyData, // return user company information
        ...(event_id ? userRoleInclude(company_id) : []),
      ],
      order: [[{ model: Image, as: 'images' }, 'primary', 'DESC']],
      subQuery: false,
    });

    const events_uid = await EventUser.findAll({
      where: eventUsersWhere(event_id, id),
      attributes: ['event_id', 'uid'],
    });

    if (!userDetail) throw new NotFoundException('User not found!');

    const updatedData = { ...userDetail.get({ plain: true }) };

    updatedData.divisions = updatedData.user_incident_divisions.map(
      (division) => ({
        ...division.incident_division,
      }),
    );

    // remove duplicates
    updatedData.divisions = Array.from(
      new Map(updatedData.divisions.map((item) => [item.id, item])).values(),
    );

    delete updatedData.user_incident_divisions;

    return { ...updatedData, events_uid };
  }

  async getUserByIdMobile(id: number, currUser: User, option?: Options) {
    const currentCompaniesIds = await currentCompanies(currUser);

    const where = { id };

    if (
      currUser['role'] !== RolesNumberEnum.SUPER_ADMIN &&
      currUser['role'] !== RolesNumberEnum.ONTRACK_MANAGER
    )
      where['$users_companies_roles.company_id$'] = {
        [Op.in]: currentCompaniesIds,
      };

    const user = await User.findOne({
      where: { id },
      attributes: [
        'id',
        'email',
        'name',
        'cell',
        'employee',
        'first_name',
        'last_name',
        'active',
        'app_version',
        'demo_user',
        'device_model',
        'employee',
        'blocked_at',
        'message_service',
        'pin',
        'reference_user',
        'date_format',
        'time_format',
        'temperature_format',
        'language_code',
        [
          Sequelize.literal(
            '(CASE WHEN "User"."mfa_token" IS NOT NULL THEN TRUE ELSE FALSE END)',
          ),
          'mfa',
        ],
        'country_code',
        'country_iso_code',
        [Sequelize.literal(User.getStatusByUserKey), 'status'],
        [Sequelize.literal(`"department"."name"`), 'department_name'],
        [Sequelize.literal(`"department"."id"`), 'department_id'],
        [Sequelize.literal(`"images"."url"`), 'image_url'],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1
              FROM "users_companies_roles" AS "ucr"
              WHERE "ucr"."user_id" = "User"."id"
              AND "ucr"."role_id" = 0
            )
          `),
          'is_super_admin',
        ],
      ],
      include: [
        {
          model: Department,
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
        {
          model: Location,
          attributes: {
            exclude: ['locationable_id', 'locationable_type', 'createdAt'],
          },
        },
        { model: Image, attributes: ['id', 'url'] },
        userCompanyData,
      ],
      ...option,
    });

    if (!user) {
      throw new NotFoundException(RESPONSES.notFound('User'));
    }

    return user;
  }

  async blockUser(id: number, currentUser: User) {
    // Fetch user data with is_super_admin check using user_companies_roles
    const user = await isUserExist(id);
    const updatedBlockedStatus = user.blocked_at ? null : moment();

    const transaction = await this.sequelize.transaction();

    try {
      // Toggle the blocked_at field and update the user
      await User.update({ blocked_at: user.blocked_at ? null : moment() }, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: currentUser.id, editor_name: currentUser.name }, // Custom field for hooks
      } as UpdateOptions & {
        editor: Editor;
      });

      // If the user is now blocked, destroy their tokens
      if (updatedBlockedStatus) {
        await UserToken.destroy({ where: { user_id: id }, transaction });
      }

      // Commit the transaction after successful operations
      await transaction.commit();
    } catch (err) {
      // Log the error and rollback the transaction
      console.log('🚀 ~ UserService ~ blockUser ~ err:', err);
      await transaction.rollback();
      throwCatchError(err);
    }

    // If in production and MailChimp integration is enabled, update the contact status
    if (
      this.configService.get('ENV') === 'prod' &&
      this.configService.get('MAILCHIMP_DEPLOYMENT') === 'true'
    ) {
      await this.mailChimpService.updateContactStatus(
        !!updatedBlockedStatus,
        user.email,
      );
    }

    // Return the updated user data
    return await this.getUserByIdMobile(user.id, currentUser, {
      useMaster: true,
    });
  }

  async assignDepartment(
    assignDepartmentDivisionUserDto: AssignDepartmentDivisionUserDto,
    user: User,
  ) {
    const { department_id, users_ids, event_id } =
      assignDepartmentDivisionUserDto;

    // Optionally check if the event exists
    if (event_id) isEventExist(event_id);

    // checking is department exist or not
    const { id, company_id } = await Department.findByPk(department_id, {
      attributes: ['id', 'company_id'],
    });
    if (!id) throw new NotFoundException(ERRORS.DEPARTMENT_NOT_FOUND);

    // Check if all users exist
    const userCount = await User.count({
      where: { id: { [Op.in]: users_ids } },
    });
    if (userCount !== users_ids.length) {
      throw new NotFoundException(_ERRORS.SOME_USERS_ARE_NOT_FOUND);
    }
    // Find existing department-user relations
    const existingDepartmentUsers = await DepartmentUsers.findAll({
      where: { user_id: { [Op.in]: users_ids } },
      attributes: ['id'],
      include: [
        {
          model: Department,
          where: { company_id },
          required: true,
        },
      ],
    });

    const departmentUserIds = existingDepartmentUsers.map((data) => data.id);

    const transaction = await this.sequelize.transaction();

    try {
      // Delete existing department-user relations
      if (departmentUserIds.length) {
        await DepartmentUsers.destroy({
          where: { id: { [Op.in]: departmentUserIds } },
          transaction,
          individualHooks: true,
          editor: {
            editor_id: user.id,
            editor_name: user.name,
          },
        } as DestroyOptions & { editor: Editor });
      }

      // Bulk create new department-user relations
      const departmentUserData = users_ids.map((user_id) => ({
        user_id,
        department_id: id,
      }));

      await DepartmentUsers.bulkCreate(departmentUserData, {
        transaction,
        editor: {
          editor_id: user.id,
          editor_name: user.name,
        },
      } as BulkCreateOptions & { editor: Editor });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    try {
      const { users, activeUserCount, count } = await getAllEventUsersHelperV1(
        { event_id } as EventUsersQueryParamsDto,
        1,
        25,
        user,
      );

      const userData = getArrayInChunks(users, 10);

      for (const data of userData) {
        const socketData = {
          data,
          activeUserCount,
          count,
        };

        this.pusherService.assignStaffToDepartmentAndDivision(
          null,
          event_id,
          socketData,
        );
      }

      this.pusherService.assignStaffToDepartmentAndDivision(
        MESSAGES.DEPARTMENT_ASSIGNED_SUCCESSFULLY,
        event_id,
      );
    } catch (err) {
      console.log('🚀 ~ UserService PUSHER ERROR ~ err:', err);
    }

    return { message: MESSAGES.DEPARTMENT_ASSIGNED_SUCCESSFULLY };
  }

  async assignDivision(params: AssignDepartmentDivisionUserDto, user: User) {
    let userIncidentDivisionsForSockets = [];
    const { event_id, division_ids, users_ids } = params;

    if (!division_ids.length)
      throw new ForbiddenException(ERRORS.DIVISION_ID_REUQUIRED);

    if (!event_id)
      throw new ForbiddenException(
        ERRORS.EVENT_ID_IS_REQUIRED_IF_USER_ASSOCIATED_WITH_PASSED_DIVISIONS_IDS,
      );

    // Validate the existence of users and divisions in parallel
    const [userCount, incidentDivisionCount] = await Promise.all([
      User.count({ where: { id: { [Op.in]: users_ids } } }),
      IncidentDivision.count({ where: { id: { [Op.in]: division_ids } } }),
    ]);

    if (userCount !== users_ids.length)
      throw new NotFoundException(_ERRORS.SOME_USERS_ARE_NOT_FOUND);

    if (incidentDivisionCount !== division_ids.length)
      throw new NotFoundException(
        _ERRORS.SOME_INCIDENT_DIVISIONS_ARE_NOT_FOUND,
      );

    const userIncidentDivisions = users_ids.flatMap((user_id) =>
      division_ids.map((division_id) => ({
        user_id,
        incident_division_id: division_id,
        event_id,
      })),
    );

    userIncidentDivisionsForSockets = users_ids.map((user_id) => ({
      userId: user_id,
      incident_division_ids: division_ids,
    }));

    const transaction = await this.sequelize.transaction();

    try {
      // Use bulkCreate with ignoreDuplicates or onConflict to handle existing entries
      await UserIncidentDivision.bulkCreate(userIncidentDivisions, {
        transaction,
        ignoreDuplicates: true,
        editor: {
          editor_id: user.id,
          editor_name: user.name,
        },
      } as BulkCreateOptions & { editor: Editor });

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ UserService ~ assignDivision ~ err:', err);
      await transaction.rollback();
      throwCatchError(err);
    }

    const { users, activeUserCount, count } = await getAllEventUsersHelperV1(
      { event_id } as EventUsersQueryParamsDto,
      1,
      25,
      user,
    );

    const userData = getArrayInChunks(users, 10);

    for (const data of userData) {
      const socketData = {
        data,
        activeUserCount,
        count,
      };

      this.pusherService.assignStaffToDepartmentAndDivision(
        null,
        event_id,
        socketData,
      );
    }

    this.pusherService.assignStaffToDepartmentAndDivision(
      MESSAGES.DIVISION_ASSIGNED_SUCCESSFULLY,
      event_id,
    );

    if (userIncidentDivisions.length) {
      sendMultipleUserIncidentDivisionUpdate(
        userIncidentDivisionsForSockets,
        event_id,
        this.pusherService,
      );
    }

    return { message: MESSAGES.DIVISION_ASSIGNED_SUCCESSFULLY };
  }

  async assignEvent(
    assignUnassignEventDto: AssignUnassignEventDto,
    user: User,
  ) {
    const { user_ids, event_ids } = assignUnassignEventDto;

    // checking all passed events and users are exist or not
    const { events } = await usersAndEventsExist(event_ids, user_ids);

    // Prepare bulk insert data
    const eventUserData = events.flatMap(({ id: event_id }) =>
      user_ids.map((user_id) => ({ user_id, event_id })),
    );

    const transaction = await this.sequelize.transaction();

    try {
      // Bulk insert event-user assignments, avoiding duplicates
      await EventUser.bulkCreate(eventUserData, {
        transaction,
        ignoreDuplicates: true, // Ensure no duplicates are inserted
        editor: {
          editor_id: user.id,
          editor_name: user.name,
        },
      } as BulkCreateOptions & { editor: Editor });

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ UserService ~ err:', err);
      await transaction.rollback();

      throwCatchError(err);
    }

    // Notify pusher service about the event assignment (one call per event)
    try {
      await Promise.all(
        events.map(({ id: event_id }) =>
          this.pusherService.assignStaffToDepartmentAndDivision(
            MESSAGES.DIVISION_ASSIGNED_SUCCESSFULLY,
            event_id,
          ),
        ),
      );
    } catch (err) {
      console.log(
        '🚀 ~ UserService ~ (Assign user to Event) Pusher Service -> assignStaffToDepartmentAndDivision:',
        err,
      );
    }

    return { message: RESPONSES.assignedSuccessfully('Event') };
  }

  async unassignEvent(
    assignUnassignEventDto: AssignUnassignEventDto,
    user: User,
  ) {
    const { user_ids, event_ids } = assignUnassignEventDto;

    // checking all passed events and users are exist or not
    const { events, users } = await usersAndEventsExist(event_ids, user_ids);

    const transaction = await this.sequelize.transaction();

    try {
      // disassociate users from events
      await EventUser.destroy({
        where: {
          user_id: { [Op.in]: users.map(({ id }) => id) },
          event_id: { [Op.in]: events.map(({ id }) => id) },
        },
        transaction,
        individualHooks: true,
        editor: {
          editor_id: user.id,
          editor_name: user.name,
        },
      } as DestroyOptions & { editor: Editor });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    for (const { id: event_id } of events) {
      try {
        this.pusherService.assignStaffToDepartmentAndDivision(
          MESSAGES.DIVISION_ASSIGNED_SUCCESSFULLY,
          event_id,
        );
      } catch (err) {
        console.log(
          '🚀 ~ UserService ~ (Unassign user from Event) Pusher Service -> assignStaffToDepartmentAndDivision:',
          err,
        );
      }
    }

    return { message: RESPONSES.unassignedSuccessfully('Event') };
  }

  async updateBulkStatus(
    updateBulkUserStatusDto: UpdateBulkUserStatusDto,
    user: User,
  ) {
    const { user_ids, status, event_id } = updateBulkUserStatusDto;

    const transaction = await this.sequelize.transaction();

    try {
      for (const user_id of user_ids) {
        await User.update(
          { status: status === UserStatuses.AVAILABLE ? 0 : 1 },
          {
            where: { id: user_id },
            transaction,
            individualHooks: true,
            editor: { editor_id: user.id, editor_name: user.name }, // Custom field for hooks
          } as UpdateOptions & {
            editor: Editor;
          },
        );
      }

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ UserService ~ updateBulkStatus ~ err:', err);
      await transaction.rollback();
      throwCatchError(err);
    }

    this.pusherService.assignStaffToDepartmentAndDivision(
      MESSAGES.DIVISION_ASSIGNED_SUCCESSFULLY,
      event_id,
    );

    return { message: 'Status Has Been Updated' };
  }

  async updateUserStatus(
    id: number,
    updateUserStatusDto: UpdateUserStatusDto,
    user: User,
  ) {
    const { status, event_id } = updateUserStatusDto;

    // It will check if this user has permission to update user or not
    const hasPermission = await hasUserPermission(user, [
      UserAccess.USER_UPDATE_STATUS,
    ]);

    // If no permission found then only that user can edit basic info of themselves and return without performing any action.
    if (!hasPermission && id !== user.id) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    const transaction = await this.sequelize.transaction();

    try {
      await User.update({ status: status === UserStatuses.AVAILABLE ? 0 : 1 }, {
        where: { id },
        transaction,
        individualHooks: true,
        editor: { editor_id: user.id, editor_name: user.name }, // Custom field for hooks
      } as UpdateOptions & {
        editor: Editor;
      });

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ UserService ~ updateBulkStatus ~ err:', err);
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedUser = await getUserById(
      id,
      event_id,
      null,
      {
        useMaster: true,
      },
      true,
    );

    // This is for sending created users in sockets so newly created user can be visible by everyone on frontend real-time
    this.pusherService.sendUpdatedUser(updatedUser, event_id);

    if (user['is_super_admin'] || user['is_ontrack_manager']) {
      return updatedUser;
    } else {
      const companiesSubCompaniesIds = await getSubCompaniesOfGlobalAdmin(user);
      return {
        ...updatedUser,
        users_companies_roles: updatedUser?.users_companies_roles.filter(
          (role) => companiesSubCompaniesIds.includes(role.company_id),
        ),
      };
    }
  }

  async updateSettings(
    updateUserSettingsDto: UpdateUserSettingsDto,
    user: User,
  ) {
    await User.update(
      { ...updateUserSettingsDto },
      {
        where: { id: user.id },
      },
    );

    const userData = await User.findOne({
      where: { id: user.id },
      attributes: [
        'id',
        'date_format',
        'time_format',
        'temperature_format',
        'language_code',
      ],
      useMaster: true,
    });

    return userData;
  }

  async updateUser(
    body: UpdateUserDto,
    userId: number,
    currentUser: User,
    req: Request,
  ) {
    let { role } = body;
    const {
      event_id,
      status,
      images,
      division_ids,
      move_staff,
      department_id,
      vendor_id,
      user_company,
      cell,
      country_code,
      region_ids,
      multiple_events_association,
    } = body;
    let allEventIds = [];

    // It will check if this user has permission to update user or not
    const hasPermission = await hasUserPermission(currentUser, [
      UserAccess.USER_UPDATE,
      UserAccess.USER_UPDATE_STATUS,
      UserAccess.USER_UPDATE_PERSONAL_INFORMATION,
      UserAccess.USER_UPDATE_ROLE,
      UserAccess.USER_UPDATE_DEPARTMENT_DIVISION,
    ]);

    // If no permission found then only that user can edit basic info of themselves and return without performing any action.
    if (!hasPermission && userId === currentUser.id) {
      await updateSelfInfo(body, userId);

      return await this.getUserByIdMobile(userId, currentUser, {
        useMaster: true,
      });
    } else if (!hasPermission && userId !== currentUser.id) {
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    // if event_id passed when user needs to be update, then finding is the event exist or not
    const event = event_id ? await isEventExist(event_id) : null;

    // validate user before updatng
    const { regions, existingUser, userCompanyRole } =
      await createUpdateUserValidation(
        cell,
        country_code,
        role ? RolesNumberEnum[role?.toUpperCase()] : null,
        event?.company_id || user_company?.company_id,
        department_id,
        region_ids,
        currentUser,
        move_staff,
        event_id,
        division_ids,
        userId,
      );

    if (user_company?.company_id || event) {
      // Before creating a user associated with a company, it is necessary to verify if the user has access rights to this company.
      await getCompanyScope(
        currentUser,
        event?.company_id || user_company?.company_id,
      );
    }

    if (role) role = RolesNumberEnum[role.toUpperCase()];

    const transaction = await this.sequelize.transaction();

    try {
      await User.update(
        {
          ...body,
          ...(status
            ? { status: status === UserStatuses.AVAILABLE ? 0 : 1 }
            : {}),
        },
        {
          where: { id: userId },
          individualHooks: true,
          transaction,
          editor: { editor_id: currentUser.id, editor_name: currentUser.name }, // Custom field for hooks
        } as UpdateOptions & {
          editor: Editor;
        },
      );

      if (role && event) {
        // working as @AfterUpdate hook
        await UserCompanyRole.update(
          {
            role_id: role,
          },
          {
            where: { user_id: userId, company_id: event.company_id },
            transaction,
            individualHooks: true,
            editor: {
              editor_id: currentUser.id,
              editor_name: currentUser.name,
            },
          } as UpdateOptions & { editor: Editor },
        );
      }

      // for ios user company role update
      if (user_company) {
        await UserCompanyRole.update(
          {
            company_id: user_company.company_id,
            role_id: RolesNumberEnum[user_company.role.toUpperCase()],
          },
          {
            where: { id: user_company.id },
            transaction,
            individualHooks: true,
            editor: {
              editor_id: currentUser.id,
              editor_name: currentUser.name,
            },
          } as UpdateOptions & { editor: Editor },
        );
      }

      // associating regions with users
      if (regions?.length && userCompanyRole)
        await associateRegions(
          userCompanyRole.id,
          regions,
          true,
          currentUser,
          transaction,
        );

      // Create the user images
      images?.length &&
        (await Promise.all(
          images.map(
            async (image) =>
              await Image.create(
                {
                  url: image,
                  imageable_id: userId,
                  imageable_type: PolymorphicType.USER,
                },
                { transaction },
              ),
          ),
        ));

      if (event_id) {
        allEventIds = (
          await Event.findAll({
            where: { company_id: event.company_id },
            attributes: ['id'],
          })
        ).map((event) => event.id);
        // user incident divisions association and disassociation
        if (division_ids?.length) {
          const newDivisionData = division_ids.map((divisionId) => ({
            event_id,
            user_id: userId,
            incident_division_id: divisionId,
          }));

          await UserIncidentDivision.bulkCreate(newDivisionData, {
            transaction,
            ignoreDuplicates: true,
            editor: {
              editor_id: currentUser.id,
              editor_name: currentUser.name,
            },
          } as BulkCreateOptions & { editor: Editor });

          // Delete all user incident divisions except the provided division ids
          await UserIncidentDivision.destroy({
            where: {
              user_id: userId,
              incident_division_id: {
                [Op.notIn]: division_ids,
              },
              event_id: { [Op.in]: allEventIds },
            },
            transaction,
            individualHooks: true,
            editor: {
              editor_id: currentUser.id,
              editor_name: currentUser.name,
            },
          } as DestroyOptions & { editor: Editor });
        } else if (division_ids?.length === 0) {
          // If division_ids is empty or null, delete all the incident divisions for the user
          await UserIncidentDivision.destroy({
            where: {
              user_id: userId,
              event_id: { [Op.in]: allEventIds },
            },
            transaction,
            individualHooks: true,
            editor: {
              editor_id: currentUser.id,
              editor_name: currentUser.name,
            },
          } as DestroyOptions & { editor: Editor });
        }

        // assiging this user to passed event
        const eventUser = await EventUser.findOne({
          where: { event_id: event.id, user_id: userId },
          attributes: ['id'],
        });

        if (!eventUser) {
          await EventUser.create(
            {
              event_id: event.id,
              user_id: userId,
            },
            {
              transaction,
              editor: {
                editor_id: currentUser.id,
                editor_name: currentUser.name,
              },
            } as CreateOptions & { editor: Editor },
          );
        }
      }

      // If vendor exist against the target event then create the vendor user record
      if (event_id) {
        const vendor =
          currentUser['role'] === RolesEnum.VENDOR
            ? await Vendor.findOne({
                where: {
                  id: vendor_id,
                  company_id: currentUser['company_id'],
                },
                include: [
                  {
                    model: VendorUsers,
                    where: { user_id: currentUser.id },
                    required: true,
                  },
                ],
              })
            : null;

        if (vendor) {
          const vendorUser = (
            await VendorUsers.findOrCreate({
              where: event_id
                ? { event_id, user_id: userId }
                : { user_id: userId },
              transaction,
            })
          )[0];

          vendorUser.vendor_id = vendor.id;
          vendorUser.save();
        }
      }

      // If department exist against the provided departmentId then create department user if not exist
      if (department_id && (event || user_company)) {
        // finding existing department of current company
        const existingDepartment = await Department.findOne({
          where: {
            company_id: userCompanyRole?.company_id || user_company?.company_id,
          },
          attributes: ['id'],
          include: [
            {
              model: DepartmentUsers,
              where: { user_id: userId },
              attributes: [],
            },
          ],
        });

        if (department_id !== existingDepartment?.id) {
          // if not linked with existing department, need to associate new department
          if (!existingDepartment) {
            await DepartmentUsers.create({ department_id, user_id: userId }, {
              transaction,
              editor: {
                editor_id: currentUser.id,
                editor_name: currentUser.name,
              },
            } as CreateOptions & { editor: Editor });
          } else {
            // if linked with existing department, need to update with new department
            await DepartmentUsers.update({ department_id }, {
              where: {
                user_id: userId,
                department_id: existingDepartment.id,
              },
              transaction,
              individualHooks: true,
              editor: {
                editor_id: currentUser.id,
                editor_name: currentUser.name,
              },
            } as UpdateOptions & {
              editor: Editor;
            });
          }
        }
      } else if (department_id && !event && !user_company)
        throw new UnprocessableEntityException(
          _ERRORS.DEPARTMENT_CHANGE_WHILE_UPDATING_USER,
        );

      if (move_staff && event) {
        await moveStaffToAnotherCompanyAndDepartment(
          move_staff,
          userId,
          event.company_id,
          currentUser,
          transaction,
        );
      }

      if (multiple_events_association?.length)
        await associateMultipleEvents(
          multiple_events_association,
          event?.company_id || user_company?.company_id,
          userId,
          department_id,
          transaction,
        );

      // Commit the all above transactions
      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ UserService ~ updateUser ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    if (event_id) {
      const socketUser = await getUserById(
        userId,
        event_id,
        move_staff ? true : false,
        { useMaster: true },
      );

      // This is for sending created users in sockets so newly created user can be visible by everyone on frontend real-time
      this.pusherService.sendUpdatedUser(socketUser, event_id);
      this.pusherService.assignStaffToDepartmentAndDivision(
        socketUser,
        event_id,
      );

      if (division_ids?.length && event_id) {
        sendUserIncidentDivisionUpdate(
          { incidentDivisionIds: division_ids, userId },
          event_id,
          this.pusherService,
        );
      }

      const webhookData = {
        body: {
          company_id: event.company_id,
          event_id,
          user_id: userId,
        },
        channel_name: RailsWebhookChannel.UPDATE_USER,
      };

      try {
        await postRequest(
          req.headers.authorization,
          this.httpService,
          webhookData,
          rails_webhook_url,
        );
      } catch (err) {
        console.log('🚀 ~ DepartmentService ~ err:', err);
      }
    }

    if (division_ids?.length || division_ids?.length === 0) {
      try {
        const userIncidentDivision = await this.getIncidentDivisions(userId);

        sendUpdatedUserDivision(
          {
            userIncidentDivision,
          },
          userId,
          'update',
          SocketTypes.USER,
          true,
          this.pusherService,
        );
      } catch (e) {
        console.log('🚀 ~ UserService ~ e:', e);
      }
    }

    const option = { useMaster: true };

    const updatedUser = event_id
      ? await getUserById(userId, event_id, null, option)
      : await this.getUserByIdMobile(userId, currentUser, option);

    const plainedUser = updatedUser.get
      ? updatedUser.get({ plain: true })
      : updatedUser;

    if (
      this.configService.get('ENV') === 'prod' &&
      this.configService.get('MAILCHIMP_DEPLOYMENT') === 'true'
    ) {
      // after updating a user in database, now updating this user detail in MailChimp Audience List
      await this.mailChimpService.updateContact(existingUser, plainedUser);
    }

    if (currentUser['is_super_admin'] || currentUser['is_ontrack_manager']) {
      return updatedUser;
    } else {
      const companiesSubCompaniesIds =
        await getSubCompaniesOfGlobalAdmin(currentUser);

      return {
        ...plainedUser,
        users_companies_roles: plainedUser?.users_companies_roles.filter(
          (role) => companiesSubCompaniesIds.includes(role.company_id),
        ),
      };
    }
  }

  async deleteUserAttachment(id: number, attachmentId: number) {
    const user = await User.findOne({
      where: { id },
      attributes: ['id'],
      include: [
        {
          model: Image,
          where: { id: attachmentId },
          attributes: [],
        },
      ],
    });
    if (!user)
      throw new NotFoundException('Attachment not found against this user!');

    // delete attachment
    const deletedImage = await this.imageService.deleteImage(attachmentId);

    deletedImage['isDeleted'] = true;
    this.pusherService.sendUpdatedAttachment(
      deletedImage,
      PolymorphicType.USER,
      id,
    );

    return { message: RESPONSES.destroyedSuccessfully('User Attachment') };
  }
}
