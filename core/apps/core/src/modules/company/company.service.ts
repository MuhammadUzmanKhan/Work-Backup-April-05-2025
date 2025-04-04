import { ConfigService } from '@nestjs/config';
import { v2 } from '@google-cloud/translate';
import { CreateOptions, Op, UpdateOptions } from 'sequelize';
import { Response, Request } from 'express';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { HttpService } from '@nestjs/axios';
import { ContactType, Editor } from '@ontrack-tech-group/common/constants';
import {
  SortBy,
  ERRORS,
  EventStatus,
  PolymorphicType,
  RolesNumberEnum,
  Options,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSizeWithCsvPdfParam,
  getPageAndPageSizeWithDefault,
  getRegionsAndSubRegions,
  getScopeAndCompanyIds,
  isCompanyExist,
  isUpperRoles,
  successInterceptorResponseFormat,
  throwCatchError,
  userRegionsWhere,
} from '@ontrack-tech-group/common/helpers';
import {
  User,
  Event,
  Company,
  UserPins,
  CompanyContact,
} from '@ontrack-tech-group/common/models';
import {
  AnalyticCommunicationService,
  ChangeLogService,
  PusherService,
  TranslateService,
  UsersPinsService,
} from '@ontrack-tech-group/common/services';
import { EventService } from '@Modules/event/event.service';
import { DashboardDropdownsQueryDto } from '@Common/dto';
import { CompanyCategoryType, _ERRORS } from '@Common/constants';
import { EventUserModel } from '@Modules/event/helpers';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import {
  CompanySubcompanyFilterDto,
  CreateCompanyDto,
  CreateSubcompanyDto,
  SubcompaniesWithEvents,
  UpdateCompanyDto,
  GetCompanyByIdDto,
  SubcompaniesWithEventsAndCategory,
} from './dto';
import {
  companiesAttributes,
  companyNamesWhere,
  eventCountWhere,
  generateCompanyDetailPdfAndGetUrl,
  generateCsvOrPdfForGlobalCompanies,
  generateCsvOrPdfForUniversalCompanies,
  getAllCompaniesWhereQuery,
  getCompanyWhereQuery,
  formatCoordinatesObject,
  isCompanyAlreadyExistWithName,
  updateCompanyLegalContacts,
  updateCompanySecondaryContacts,
  createCompanyBulkContacts,
  sendUpdatedCompany,
} from './helpers';
@Injectable()
export class CompanyService {
  constructor(
    private readonly eventService: EventService,
    private readonly httpService: HttpService,
    private readonly userPinsService: UsersPinsService,
    private readonly analyticCommunicationService: AnalyticCommunicationService,
    private readonly sequelize: Sequelize,
    private readonly changeLogService: ChangeLogService,
    private readonly translateService: TranslateService,
    private readonly configService: ConfigService,
    private readonly pusherService: PusherService,
    @Inject('TRANSLATE') private readonly googleTranslate: v2.Translate,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto, user: User) {
    const { name, location, legal_contacts, secondary_contacts } =
      createCompanyDto;
    let createdCompany: Company;

    await isCompanyAlreadyExistWithName(name);

    const transaction = await this.sequelize.transaction();

    try {
      createCompanyDto['created_by'] = user.id;

      createdCompany = await Company.create(
        {
          ...createCompanyDto,
          coordinates: await formatCoordinatesObject(
            location,
            this.httpService,
          ),
        },
        {
          include: [{ association: 'company_contact' }],
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & {
          editor: Editor;
        },
      );

      // if legal_contacts array is coming, creating legal contacts against this company
      if (legal_contacts?.length) {
        await createCompanyBulkContacts(
          legal_contacts,
          createdCompany.id,
          ContactType.LEGAL_CONTACT,
          transaction,
        );
      }

      // if secondary_contacts array is coming, creating secondary contacts against this company
      if (secondary_contacts?.length) {
        await createCompanyBulkContacts(
          secondary_contacts,
          createdCompany.id,
          ContactType.SECONDARY_CONTACT,
          transaction,
        );
      }

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ CompanyService ~ createCompany ~ err:', err);
      await transaction.rollback();
      throwCatchError(err);
    }

    try {
      // This is for sending update to dashboard/analytics service
      this.analyticCommunicationService.analyticCommunication(
        { companyId: createdCompany.id, isNewCompany: true },
        'company',
        user,
      );
    } catch (e) {
      console.log('🚀 ~ CompanyService ~ createCompany ~ e:', e);
    }

    return await this.getCompanyById(createdCompany.id, user, null, null, {
      useMaster: true,
    });
  }

  async createSubcompany(createSubcompanyDto: CreateSubcompanyDto, user: User) {
    const { parent_id, name, location, legal_contacts, secondary_contacts } =
      createSubcompanyDto;
    let createdSubcompany: Company;

    const parentCompany = await Company.findByPk(parent_id);
    if (!parentCompany)
      throw new NotFoundException(ERRORS.PARENT_COMPANY_NOT_FOUND);

    await isCompanyAlreadyExistWithName(name);

    const transaction = await this.sequelize.transaction();

    try {
      createSubcompanyDto['created_by'] = user.id;

      createdSubcompany = await Company.create(
        {
          ...createSubcompanyDto,
          coordinates: await formatCoordinatesObject(
            location,
            this.httpService,
          ),
        },
        {
          include: [{ association: 'company_contact' }],
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
        } as CreateOptions & {
          editor: Editor;
        },
      );

      // if legal_contacts array is coming, creating legal contacts against this sub_company
      if (legal_contacts?.length) {
        await createCompanyBulkContacts(
          legal_contacts,
          createdSubcompany.id,
          ContactType.LEGAL_CONTACT,
          transaction,
        );
      }

      // if secondary_contacts array is coming, creating secondary contacts against this sub_company
      if (secondary_contacts?.length) {
        await createCompanyBulkContacts(
          secondary_contacts,
          createdSubcompany.id,
          ContactType.SECONDARY_CONTACT,
          transaction,
        );
      }

      await transaction.commit();
    } catch (e) {
      console.log(e);
      await transaction.rollback();
      throwCatchError(e);
    }

    try {
      // This is for sending update to dashboard/analytics service
      this.analyticCommunicationService.analyticCommunication(
        { companyId: createdSubcompany.id, isNewCompany: true },
        'company',
        user,
      );
    } catch (e) {
      console.log('🚀 ~ CompanyService ~ e:', e);
    }

    return await this.getCompanyById(createdSubcompany.id, user, null, null, {
      useMaster: true,
    });
  }

  async findAllParentCompaniesOnly(
    dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    user: User,
  ) {
    const { page, page_size, selected_id } = dashboardDropdownsQueryDto;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);
    const order: any = [];

    if (selected_id) {
      order.push([
        Sequelize.literal(`CASE WHEN id = ${selected_id} THEN 0 ELSE 1 END`),
        SortBy.ASC,
      ]);
    }

    order.push(['name', SortBy.ASC]);

    const companies = await Company.findAndCountAll({
      where: {
        parent_id: null,
        ...(await companyNamesWhere(dashboardDropdownsQueryDto, user)),
      },
      attributes: [
        'id',
        'name',
        'category',
        'region_id',
        'demo_company',
        'location',
      ],
      order,
      limit: _page_size,
      offset: _page_size * _page,
    });

    const { rows, count } = companies;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async findAllSubcompaniesOnly(
    dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    user: User,
  ) {
    const { page, page_size, selected_id } = dashboardDropdownsQueryDto;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);
    const order: any = [];

    if (selected_id) {
      order.push([
        Sequelize.literal(`CASE WHEN id = ${selected_id} THEN 0 ELSE 1 END`),
        SortBy.ASC,
      ]);
    }

    order.push(['name', SortBy.ASC]);

    const companies = await Company.findAndCountAll({
      where: {
        parent_id: {
          [Op.ne]: null,
        },
        ...(await companyNamesWhere(dashboardDropdownsQueryDto, user)),
      },
      attributes: ['id', 'name', 'region_id'],
      order,
      limit: _page_size,
      offset: _page_size * _page,
    });

    return {
      data: companies.rows,
      pagination: calculatePagination(companies.count, _page_size, _page),
    };
  }

  async findGlobalCompanyScopeIds(
    dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
    user: User,
  ) {
    const { page, page_size, selected_id } = dashboardDropdownsQueryDto;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);
    const order: any = [];

    if (selected_id) {
      order.push([
        Sequelize.literal(`CASE WHEN id = ${selected_id} THEN 0 ELSE 1 END`),
        SortBy.ASC,
      ]);
    }

    order.push(['name', SortBy.ASC]);

    if (
      user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
      user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN
    ) {
      const { companyIds } = await getScopeAndCompanyIds(user);

      const companies = await Company.findAndCountAll({
        where: {
          id: { [Op.in]: companyIds },
          ...(await companyNamesWhere(dashboardDropdownsQueryDto, user)),
        },
        attributes: ['id', 'name', 'region_id'],
        order,
        limit: _page_size,
        offset: _page_size * _page,
      });

      const totalEvents = await Event.count({
        where: await eventCountWhere(user, companyIds, true),
        include: !isUpperRoles(Number(user['role']))
          ? [EventUserModel(user.id)]
          : [],
      });

      return {
        data: companies.rows,
        pagination: calculatePagination(companies.count, _page_size, _page),
        counts: { totalEvents },
      };
    }
    return [];
  }

  /**
   * Fetching all subcompanies with company_id
   */
  async findAllSubcompaniesByCompanyId(
    id: number,
    user: User,
    options?: Options,
  ) {
    if (
      user &&
      user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
      user['role'] !== RolesNumberEnum.ONTRACK_MANAGER &&
      id !== user['company_id']
    )
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    await isCompanyExist(id);

    return await Company.findAll({
      where: { parent_id: id, ...(await userRegionsWhere(user, false, true)) },
      attributes: ['id', 'name', 'category', 'region_id', 'demo_company'],
      order: [['name', SortBy.ASC]],
      ...options,
    });
  }

  /**
   * Fetching company category by company_id
   */
  async getCompanyCategory(id: number, user: User) {
    await isCompanyExist(id);

    return await Company.findOne({
      where: { id, ...(await userRegionsWhere(user, false, true)) },
      attributes: ['id', 'name', 'category', 'region_id'],
    });
  }

  /**
   * Child Companies with active events and total events count
   */
  async findAllChildCompaniesWithEvents(
    params: SubcompaniesWithEventsAndCategory,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { csv_pdf, page, page_size, sort_column, order, company_id } = params;

    const userCompanyCategoryCheck =
      !user['is_super_admin'] && !user['is_ontrack_manager'] && user['category']
        ? ` AND "events"."event_category" = '${user['category']}'`
        : '';
    const regionCheck = await userRegionsWhere(user, true);

    if (
      (user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
        user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
        user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
        user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
      company_id !== user['company_id']
    )
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    const [_page, _page_size] = getPageAndPageSizeWithCsvPdfParam(
      page,
      page_size,
    );

    const companyIds = await Company.findAll({
      where: await getCompanyWhereQuery(params, user),
      attributes: ['id', 'name'],
      include: [
        {
          model: Event,
          where: {
            status: EventStatus.IN_PROGRESS,
            ...(await userRegionsWhere(user, false)),
          },
          attributes: [],
          required: false,
        },
      ],
      limit: _page_size,
      offset: _page_size * _page,
      order: [[sort_column || 'name', order || SortBy.ASC]],
      subQuery: false,
      group: ['Company.id'],
    });

    const companies = await Company.findAll({
      where: { id: { [Op.in]: companyIds.map(({ id }) => id) } },
      attributes: [
        ...companiesAttributes,
        [
          Sequelize.literal(`(
            SELECT COUNT ( "events"."id" ) :: INTEGER FROM events
            WHERE ("events"."company_id" IN
                (SELECT "id" FROM companies WHERE "companies"."parent_id" = "Company"."id")
                OR "events"."company_id" = "Company"."id")
            AND "events"."deleted_at" IS NULL
            AND ("events"."request_status" IS NULL OR "events"."request_status" = 'approved')
          ${userCompanyCategoryCheck}${regionCheck}
          )`),
          'totalCount',
        ],
        [
          Sequelize.literal(
            `(SELECT name FROM companies where "id"="Company"."parent_id")`,
          ),
          'parentCompany',
        ],
      ],
      include: [
        {
          model: Event,
          where: {
            status: EventStatus.IN_PROGRESS,
            ...(await userRegionsWhere(user, false)),
          },
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: [[sort_column || 'name', order || SortBy.ASC]],
    });

    // counting companies with filters and searchable fields
    const totalCompanies = await Company.findAll({
      attributes: ['id', 'parent_id'],
      where: await getCompanyWhereQuery(params, user),
      include: [
        {
          model: Event,
          where: {
            status: EventStatus.IN_PROGRESS,
            ...(await userRegionsWhere(user, false)),
          },
          attributes: [],
          required: false,
        },
      ],
    });

    const subcompaniesCount = totalCompanies.filter(
      (comp) => comp.parent_id,
    ).length;
    const companiesCount = totalCompanies.length - subcompaniesCount;

    if (csv_pdf) {
      return await generateCsvOrPdfForGlobalCompanies(
        params,
        companies,
        req,
        res,
        this.httpService,
      );
    }

    const eventCountCompanyIds = companyIds.map(({ id }) => id);

    const totalEvents = await Event.count({
      where: await eventCountWhere(user, eventCountCompanyIds, true),
      include: !isUpperRoles(Number(user['role']))
        ? [EventUserModel(user.id)]
        : [],
    });

    return res.send(
      successInterceptorResponseFormat({
        data: companies,
        pagination: calculatePagination(
          totalCompanies.length,
          _page_size,
          _page,
        ),
        counts: {
          totalEvents,
          companiesCount,
          subcompaniesCount,
        },
      }),
    );
  }

  /**
   * Child Company with active events and total events count
   */
  async findAllEventsOfsubcompany(params: SubcompaniesWithEvents, user?: User) {
    if (
      user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
      user['role'] !== RolesNumberEnum.ONTRACK_MANAGER &&
      params.company_id !== user['company_id']
    )
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    return await this.eventService.findAllEventsOfsubcompany(params, user);
  }

  /**
   * Parent Companies with sub-companies
   */
  async allCompanyNames(user: User) {
    let companyAndSubcompaniesIds: number[];

    if (user['company_id']) {
      if (
        user['role'] === RolesNumberEnum.ADMIN ||
        user['role'] === RolesNumberEnum.OPERATIONS_MANAGER ||
        user['role'] === RolesNumberEnum.TASK_ADMIN ||
        user['role'] === RolesNumberEnum.DOTMAP_ADMIN
      ) {
        companyAndSubcompaniesIds = [user['company_id']];
      } else if (
        user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
        user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
        user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
        user['role'] === RolesNumberEnum.REGIONAL_ADMIN ||
        user['role'] === RolesNumberEnum.LEGAL_ADMIN
      ) {
        const subCompanies = await this.findAllSubcompaniesByCompanyId(
          +user['company_id'],
          user,
        );

        // making an array of company and subcompanies ids and passing this array to fetch all companies and subcompanies in Company Where Function
        companyAndSubcompaniesIds = [
          ...subCompanies.map(({ id }) => id),
          +user['company_id'],
        ];
      }
    }

    const companies = await Company.findAll({
      where:
        !user['is_super_admin'] && !user['is_ontrack_manager']
          ? {
              id: { [Op.in]: companyAndSubcompaniesIds },
              ...(await userRegionsWhere(user, false, true)),
            }
          : {},
      attributes: ['id', 'name', 'category', 'region_id'],
      order: [['name', SortBy.ASC]],
    });

    return companies;
  }

  /**
   * Parent Companies with sub-companies
   */
  async findAllCompanies(
    params: CompanySubcompanyFilterDto,
    req: Request,
    res: Response,
    user: User,
  ) {
    const { csv_pdf, page, page_size, order, sort_column } = params;
    let companyAndSubcompaniesIds: number[];
    const { company_id, subcompany_id } = params;
    const userCompanyCategoryCheck =
      !user['is_super_admin'] && !user['is_ontrack_manager'] && user['category']
        ? ` AND "events"."event_category" = '${user['category']}'`
        : '';
    const regionCheck = await userRegionsWhere(user, true);

    const [_page, _page_size] = getPageAndPageSizeWithCsvPdfParam(
      page,
      page_size,
    );

    if (company_id) {
      const subCompanies = await this.findAllSubcompaniesByCompanyId(
        +company_id,
        user,
      );

      // making an array of company and subcompanies ids and passing this array to fetch all companies and subcompanies in Company Where Function
      companyAndSubcompaniesIds = [
        ...subCompanies.map(({ id }) => id),
        +company_id,
      ];

      if (subcompany_id) companyAndSubcompaniesIds = [+subcompany_id];
    }
    /**
     * Can search a company by Parent name, company name and country, that's why added having and group in below query
     */
    const companies = await Company.findAll({
      where: await getAllCompaniesWhereQuery(
        params,
        user,
        companyAndSubcompaniesIds,
      ),
      attributes: [
        ...companiesAttributes,
        [
          Sequelize.literal(
            `(SELECT COUNT(id)::integer FROM companies where "parent_id"="Company"."id")`,
          ),
          'subcompaniesCount',
        ],
        [
          Sequelize.literal(`(
              SELECT COUNT("events"."id")::INTEGER FROM events
              WHERE ("events"."company_id" IN
                (SELECT "id" FROM companies WHERE "companies"."parent_id" = "Company"."id")
                OR "events"."company_id" = "Company"."id")
              AND "events"."deleted_at" IS NULL
              AND ("events"."request_status" IS NULL OR "events"."request_status" = 'approved')
              ${userCompanyCategoryCheck}${regionCheck}
          )`),
          'totalEventsCount',
        ],
        [Sequelize.literal(`"parent"."name"`), 'parentCompany'],
        [
          Sequelize.literal(`
            EXISTS (
              SELECT 1 FROM "user_pins"
              WHERE "user_pins"."pinable_id" = "Company"."id"
              AND "user_pins"."pinable_type" = 'Company'
              AND "user_pins"."user_id" = ${user.id}
            )
          `),
          'isPinned',
        ],
      ],
      include: [
        { model: Company, as: 'parent', attributes: [] },
        {
          model: UserPins,
          as: 'user_pin_companies',
          where: { user_id: user.id },
          attributes: [],
          required: false,
        },
      ],
      subQuery: false,
      limit: _page_size,
      offset: _page * _page_size,
      order: [
        [
          { model: UserPins, as: 'user_pin_companies' },
          'pinable_id',
          SortBy.ASC,
        ],
        [sort_column || 'name', order || SortBy.ASC],
      ],
    });

    // counting companies with filters and searchable fields
    const totalCompanies = await Company.findAll({
      attributes: ['id', 'parent_id'],
      where: await getAllCompaniesWhereQuery(
        params,
        user,
        companyAndSubcompaniesIds,
      ),
      include: [{ model: Company, as: 'parent', attributes: [] }],
    });

    const totalEvents = await Event.count({
      where: await eventCountWhere(user, companyAndSubcompaniesIds),
      include: !isUpperRoles(Number(user['role']))
        ? [EventUserModel(user.id)]
        : [],
    });

    const subcompaniesCount = totalCompanies.filter(
      (comp) => comp.parent_id,
    ).length;
    const companiesCount = totalCompanies.length - subcompaniesCount;

    if (csv_pdf) {
      return await generateCsvOrPdfForUniversalCompanies(
        params,
        companies,
        req,
        res,
        totalCompanies.length,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: companies,
        pagination: calculatePagination(
          totalCompanies.length,
          _page_size,
          _page,
        ),
        companiesCount,
        subcompaniesCount,
        counts: {
          totalEvents,
        },
      }),
    );
  }

  async getCompanyChangelogs(
    id: number,
    paginationDto: PaginationDto,
    user: User,
  ) {
    const { page, page_size } = paginationDto;
    const [_page, _page_size] = getPageAndPageSizeWithDefault(page, page_size);

    await isCompanyExist(id);

    const { data, pagination } = await this.changeLogService.getChangeLogs({
      id,
      types: [PolymorphicType.COMPANY],
      page: _page,
      page_size: _page_size,
    });

    const translatedChangelogs =
      await this.translateService.translateChangeLogs(
        user,
        data,
        PolymorphicType.COMPANY,
      );

    return {
      data: translatedChangelogs,
      pagination,
    };
  }

  async getCompanyById(
    id: number,
    user: User,
    params?: GetCompanyByIdDto,
    req?: Request,
    options?: Options,
  ) {
    let regionsAndSubRegions = [];

    const userCompanyCategoryCheck =
      !user['is_super_admin'] && !user['is_ontrack_manager'] && user['category']
        ? ` AND "events"."event_category" = '${user['category']}'`
        : '';
    const regionCheck = await userRegionsWhere(user, true);
    // If user is global_admin we need to see if company id is one of its parent or child id
    // If user is admin we need to see only its company id
    if (
      (user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
        user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
        user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
        user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
      id !== user['company_id']
    ) {
      const subcompanies = await this.findAllSubcompaniesByCompanyId(
        user['company_id'],
        user,
        options,
      );

      if (subcompanies.map(({ id }) => id).indexOf(id) === -1) {
        throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
      }
    } else if (
      (user['role'] === RolesNumberEnum.ADMIN ||
        user['role'] === RolesNumberEnum.OPERATIONS_MANAGER ||
        user['role'] === RolesNumberEnum.TASK_ADMIN ||
        user['role'] === RolesNumberEnum.DOTMAP_ADMIN) &&
      id !== user['company_id']
    )
      throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);

    if (
      (user['is_global_manager'] || user['is_regional_manager']) &&
      user['region_ids']?.length
    ) {
      regionsAndSubRegions = await getRegionsAndSubRegions(user['region_ids']);
    }

    const company: Company = await Company.findByPk(id, {
      attributes: [
        ...companiesAttributes,
        [
          Sequelize.literal(`(
            SELECT COUNT("events"."id")::INTEGER FROM "events"
            WHERE ("events"."company_id" IN (
              SELECT "companies"."id" FROM "companies" WHERE "companies"."parent_id" = "Company"."id")
              OR "events"."company_id" = "Company"."id")
            AND "events"."deleted_at" IS NULL
            AND ("events"."request_status" IS NULL OR "events"."request_status" = 'approved')
            ${userCompanyCategoryCheck}${regionCheck}
          )`),
          'totalEventCount',
        ],
        [
          Sequelize.literal(
            `(SELECT COUNT(id)::integer FROM companies where ${id}="companies"."parent_id" ${regionsAndSubRegions.length ? `AND "companies"."region_id" IN (${regionsAndSubRegions})` : ''})`,
          ),
          'totalSubcompaniesCount',
        ],
        [
          Sequelize.literal(
            `(SELECT name FROM companies where "id"="Company"."parent_id")`,
          ),
          'parentCompanyName',
        ],
      ],
      include: [
        {
          model: UserPins,
          as: 'user_pin_companies',
          where: { user_id: user.id },
          attributes: ['id'],
          required: false,
        },
        {
          model: CompanyContact,
          attributes: ['id', 'name', 'number', 'email', 'type'],
        },
        {
          model: UserPins,
          as: 'user_pin_companies',
          where: { user_id: user.id },
          attributes: ['id'],
          required: false,
        },
      ],
      order: [[Sequelize.col('"company_contact"."created_at"'), SortBy.ASC]],
      ...options,
    });
    if (!company) throw new NotFoundException(ERRORS.COMPANY_NOT_FOUND);

    if (params?.pdf) {
      const response = await generateCompanyDetailPdfAndGetUrl(
        company,
        req,
        params,
        this.httpService,
      );
      return response.data;
    }

    return company;
  }

  async updateCompany(
    id: number,
    updateCompanyDto: UpdateCompanyDto,
    user: User,
  ) {
    const {
      category,
      location,
      name,
      demo_company,
      legal_contacts,
      secondary_contacts,
    } = updateCompanyDto;
    let coordinates = null;

    // checking company exist or not
    const company: Company = await isCompanyExist(id);

    if (
      user['role'] !== RolesNumberEnum.SUPER_ADMIN &&
      user['role'] !== RolesNumberEnum.ONTRACK_MANAGER
    ) {
      const subCompanies = await this.findAllSubcompaniesByCompanyId(
        user['company_id'],
        user,
      );
      // If companyId is one of the subcompanies Id
      const isCompanyOneOfSubcompany: boolean =
        subCompanies.map(({ id }) => id).indexOf(id) !== -1;

      if (
        (user['role'] === RolesNumberEnum.GLOBAL_ADMIN ||
          user['role'] === RolesNumberEnum.GLOBAL_MANAGER) &&
        !isCompanyOneOfSubcompany &&
        user['company_id'] !== id
      ) {
        throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
      }

      // if anyone expect super_admin and ontrack_manager is going to assign Demo flag to Company, throw an error
      if (demo_company) throw new ForbiddenException(ERRORS.DONT_HAVE_ACCESS);
    }

    // parent companies only have 1 categories: Standard
    if (
      company.parent_id === null &&
      category &&
      category !== CompanyCategoryType.STANDARD
    ) {
      throw new BadRequestException(_ERRORS.COMPANY_CATEGORY_ERROR);
    }

    await isCompanyAlreadyExistWithName(name, company.id);

    coordinates = await formatCoordinatesObject(location, this.httpService);

    const transaction = await this.sequelize.transaction();

    try {
      await Company.update(
        {
          ...updateCompanyDto,
          ...(coordinates && coordinates),
          updated_by: user.id,
        },

        {
          where: { id },
          transaction,
          individualHooks: true,
          editor: { editor_id: user.id, editor_name: user.name },
          configService: this.configService,
          googleTranslate: this.googleTranslate,
        } as UpdateOptions & {
          editor: Editor;
          configService: ConfigService;
          googleTranslate: v2.Translate;
        },
      );

      // update the company legal contact
      if (legal_contacts)
        await updateCompanyLegalContacts(
          legal_contacts,
          company.id,
          transaction,
        );

      if (secondary_contacts)
        await updateCompanySecondaryContacts(
          secondary_contacts,
          company.id,
          transaction,
        );

      await transaction.commit();
    } catch (err) {
      console.log('🚀 ~ CompanyService ~ e:', err);
      // Rollback the transaction if no company found
      await transaction.rollback();
      throwCatchError(err);
    }

    try {
      // This is for sending update to dashboard/analytics service
      this.analyticCommunicationService.analyticCommunication(
        { companyId: company.id, isNewCompany: false },
        'company',
        user,
      );
    } catch (e) {
      console.log('🚀 ~ CompanyService ~ e:', e);
    }

    const companyToReturn = await this.getCompanyById(
      company.id,
      user,
      null,
      null,
      {
        useMaster: true,
      },
    );

    if (company.default_lang != companyToReturn.dataValues.default_lang)
      sendUpdatedCompany(
        companyToReturn.dataValues,
        companyToReturn.dataValues.parent_id || companyToReturn.dataValues.id,
        this.pusherService,
      );

    return companyToReturn;
  }

  async pinCompany(id: number, user: User) {
    // checking company exist or not
    await isCompanyExist(id);

    // fetching company is pinned or not
    const pinnedCompany = await this.userPinsService.findUserPin(
      id,
      user.id,
      PolymorphicType.COMPANY,
    );

    if (!pinnedCompany) {
      // if not pin company exist creating new entery for pinning a company
      await this.userPinsService.createUserPin(
        id,
        user.id,
        PolymorphicType.COMPANY,
      );
    } else {
      // if pin company exist destroying old record from db
      await this.userPinsService.deleteUserPin(
        id,
        user.id,
        PolymorphicType.COMPANY,
      );
    }

    return { success: true };
  }

  async deleteCompany(id: number) {
    // checking company exist or not
    await isCompanyExist(id);

    const isCompanyDeleted = await Company.destroy({ where: { id } });
    if (!isCompanyDeleted)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    return { success: true };
  }
}
