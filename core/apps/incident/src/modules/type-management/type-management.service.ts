import { v2 } from '@google-cloud/translate';
import { Sequelize } from 'sequelize-typescript';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Company,
  IncidentType,
  IncidentTypeTranslation,
  User,
} from '@ontrack-tech-group/common/models';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  checkIfNameAlreadyExistModel,
  getCompanyScope,
  throwCatchError,
  translateWithRetry,
  checkIfRecordsExist,
  calculatePagination,
  getPageAndPageSize,
  isCompanyExist,
} from '@ontrack-tech-group/common/helpers';
import { CreateOptions, Op, UpdateOptions } from 'sequelize';
import {
  Editor,
  RESPONSES,
  SortBy,
  PolymorphicType,
} from '@ontrack-tech-group/common/constants';
import {
  ChangeLogService,
  PusherService,
  TranslateService,
} from '@ontrack-tech-group/common/services';
import { IncidentTypeSortingColumns, SocketTypes } from '@Common/constants';
import { ConfigService } from '@nestjs/config';
import { isIncidentTypeExist } from '@Modules/incident-type/helpers';
import {
  CreateNewIncidentTypeAndVariationDto,
  CreateTypeVariationDto,
  GetAllVariantsDto,
  GetCountDto,
  GetIncidentTranslationChangelogDto,
  GetTranslationsDto,
  UpdateTypeVariationDto,
} from './dto';
import {
  incidentTranslationChangeLogWhere,
  incidentTypeTranslationById,
  sendUpdatedIncidentTypesVariant,
} from './helper';

@Injectable()
export class IncidentTypeManagement {
  constructor(
    private sequelize: Sequelize,
    private readonly configService: ConfigService,
    @Inject('TRANSLATE') private readonly googleTranslate: v2.Translate,
    private readonly changeLogService: ChangeLogService,
    private readonly translateService: TranslateService,
    private readonly pusherService: PusherService,
  ) {}

  async createTypeVariation(
    createTypeVariationDto: CreateTypeVariationDto,
    user: User,
  ) {
    const {
      core_incident_type_id,
      core_name,
      company_id,
      language,
      variant_name,
      sub_company_id,
    } = createTypeVariationDto;

    await getCompanyScope(user, company_id);

    const isSubCompanyExists = await checkIfRecordsExist(
      Company,
      {
        id: sub_company_id,
        parent_id: company_id,
      },
      ['id'],
    );

    if (!isSubCompanyExists)
      throw new NotFoundException('SubCompany Not Found');

    let coreIncidentType = null;

    const transaction = await this.sequelize.transaction();

    // check if parent incident exist
    if (core_incident_type_id)
      coreIncidentType = await isIncidentTypeExist(
        company_id,
        core_incident_type_id,
      );
    else if (core_name) {
      await checkIfNameAlreadyExistModel(
        IncidentType,
        'Incident Type',
        core_name,
        company_id,
      );

      coreIncidentType = await IncidentType.create(
        {
          company_id,
          name: core_name,
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
          company_id,
        },
      );
      const company = await checkIfRecordsExist(Company, { id: company_id }, [
        'default_lang',
      ]);

      await IncidentTypeTranslation.create(
        {
          language: company[0].default_lang,
          translation: coreIncidentType.name,
          incident_type_id: coreIncidentType.id,
        },
        {
          transaction,
        },
      );
    } else throw new NotFoundException(RESPONSES.notFound('Core type name'));

    let incidentTypeTranslation: IncidentTypeTranslation = null;

    try {
      const isIncidentVariantAlreadyExists = await checkIfRecordsExist(
        IncidentType,
        {
          name: variant_name,
          parent_id: coreIncidentType.id,
          company_id: sub_company_id,
        },
        ['id'],
      );

      if (isIncidentVariantAlreadyExists)
        throw new ConflictException(RESPONSES.alreadyExist('Incident Variant'));

      const incidentVariation = await IncidentType.create(
        {
          ...createTypeVariationDto,
          name: variant_name,
          parent_id: core_incident_type_id || coreIncidentType.id,
          company_id: sub_company_id,
        },
        {
          transaction,
        },
      );

      const translatedText = await translateWithRetry(
        variant_name,
        language,
        this.googleTranslate,
        this.configService.get('MAX_TRANSLATE_ATTEMPT'),
      );

      incidentTypeTranslation = await IncidentTypeTranslation.create(
        {
          language,
          translation: translatedText || 'N/A',
          incident_type_id: incidentVariation.id,
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
          company: {
            company_id,
            sub_company_id,
            core_incident_type_name: coreIncidentType.name,
            core_incident_type_id: coreIncidentType.id,
          },
        },
      );

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ IncidentTypeManagement ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    sendUpdatedIncidentTypesVariant(
      {
        data: {
          incidentTypeTranslation: await incidentTypeTranslationById(
            incidentTypeTranslation.id,
          ),
          coreIncidentType,
        },
      },
      company_id,
      core_incident_type_id ? 'create' : 'bulkCreate', // this is frontend requirment they have check on bulk create in case of ghost
      SocketTypes.INCIDENT_TYPE_VARIATION,
      true,
      this.pusherService,
    );

    return { message: 'Varaition With Translation Created Successfully' };
  }

  async createNewIncidentTypeAndVariation(
    createNewIncidentTypeAndVariationDto: CreateNewIncidentTypeAndVariationDto,
    user: User,
  ) {
    const { company_id, core_incident_type_name, variations, color } =
      createNewIncidentTypeAndVariationDto;

    await getCompanyScope(user, company_id);

    let coreIncidentType: IncidentType = null;
    let incidentTypeTranslations: IncidentTypeTranslation[] = null;

    const coreIncidentTypeAlreadyExist = await IncidentType.count({
      where: {
        company_id,
        name: core_incident_type_name,
        parent_id: null,
      },
    });

    if (coreIncidentTypeAlreadyExist)
      throw new ConflictException(
        RESPONSES.alreadyExist('Core Incident Type With Same Name'),
      );

    const transaction = await this.sequelize.transaction();

    try {
      coreIncidentType = await IncidentType.create(
        {
          name: core_incident_type_name,
          color,
          company_id,
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
          company_id,
        } as CreateOptions & { editor: Editor; company_id: number },
      );

      const company = await checkIfRecordsExist(Company, { id: company_id }, [
        'default_lang',
      ]);

      await IncidentTypeTranslation.create(
        {
          language: company[0].default_lang,
          translation: coreIncidentType.name,
          incident_type_id: coreIncidentType.id,
        },
        {
          transaction,
        },
      );

      const subIncidentTypesToCreate = [];
      const subIncidentTypesTranslationsToCreate = [];

      variations.map((variation) => {
        const { sub_company_id, variation_name } = variation;
        subIncidentTypesToCreate.push({
          company_id: sub_company_id,
          name: variation_name,
          parent_id: coreIncidentType.id,
        });
      });

      const createdSubIncidentTypes = await IncidentType.bulkCreate(
        subIncidentTypesToCreate,
        {
          transaction,
        },
      );

      const langMap = new Map(
        variations.map((variation) => [
          variation.sub_company_id,
          variation.default_lang,
        ]),
      );

      for (const createdSubIncidentType of createdSubIncidentTypes) {
        subIncidentTypesTranslationsToCreate.push({
          language: langMap.get(createdSubIncidentType.company_id),
          translation: createdSubIncidentType.name,
          incident_type_id: createdSubIncidentType.id,
        });
      }

      incidentTypeTranslations = await IncidentTypeTranslation.bulkCreate(
        subIncidentTypesTranslationsToCreate,
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
          company_id,
        } as CreateOptions & { editor: Editor; company_id: number },
      );

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ IncidentTypeManagement ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    sendUpdatedIncidentTypesVariant(
      {
        data: {
          incidentTypeTranslation: await incidentTypeTranslationById(
            incidentTypeTranslations.map(
              (incidentTypeTranslation) => incidentTypeTranslation.id,
            ),
          ),
          coreIncidentType,
        },
      },
      company_id,
      'bulkCreate',
      SocketTypes.INCIDENT_TYPE_VARIATION,
      true,
      this.pusherService,
    );

    return { message: 'Translations created Successfully' };
  }

  async updateTypeVariation(
    pathParamIdDto: PathParamIdDto,
    updateTypeVariationDto: UpdateTypeVariationDto,
    user: User,
  ) {
    const { id } = pathParamIdDto;
    const {
      incident_type_id,
      company_id,
      name,
      language,
      sub_company_id,
      core_incident_type_id,
    } = updateTypeVariationDto;

    await getCompanyScope(user, company_id);

    // checking uniqueness in all variants of same sub company
    const allIncidentTypeVariants = await IncidentType.findAll({
      where: {
        company_id: sub_company_id,
        parent_id: core_incident_type_id,
      },
      attributes: ['id'],
    });

    const allIncidentTypeVariantsIds = allIncidentTypeVariants.map(
      (allIncidentTypeVariants) => allIncidentTypeVariants.id,
    );

    const translationAlreadyExists = await IncidentTypeTranslation.findOne({
      where: {
        language,
        translation: name,
        incident_type_id: {
          [Op.in]: allIncidentTypeVariantsIds, // from all sibling variants
        },
        id: { [Op.ne]: id }, // except itself
      },
    });

    if (translationAlreadyExists)
      throw new ConflictException(
        RESPONSES.alreadyExist('Variant With Same Name'),
      );

    const incidentTypeTranslation = await IncidentTypeTranslation.findOne({
      where: {
        language,
        id,
        incident_type_id,
      },
    });

    if (!incidentTypeTranslation)
      throw new NotFoundException(
        RESPONSES.notFound(`Incident type variant with id ${id}`),
      );

    let updatedIncidentType = null;

    const transaction = await this.sequelize.transaction();

    try {
      updatedIncidentType = await incidentTypeTranslation.update(
        {
          translation: name,
        },
        {
          transaction,
          editor: { editor_id: user.id, editor_name: user.name },
          company: { company_id, sub_company_id },
        } as UpdateOptions & {
          editor: Editor;
          company: { company_id: number; sub_company_id: number };
        },
      );

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ IncidentTypeManagement ~ error:', error);
      await transaction.rollback();
    }

    if (updatedIncidentType) {
      sendUpdatedIncidentTypesVariant(
        { incidentTypeTranslation: await incidentTypeTranslationById(id) },
        company_id,
        'update',
        SocketTypes.INCIDENT_TYPE_VARIATION,
        false,
        this.pusherService,
      );

      return { message: 'Variation With Translation Updated Successfully' };
    } else throwCatchError('Error Updating Variant');
  }

  async getTranslationsForSubCompanies(
    getTranslationsDto: GetTranslationsDto,
    user: User,
  ) {
    const { company_id, name } = getTranslationsDto;

    await getCompanyScope(user, company_id);

    const subCompanies = await Company.findAll({
      where: { parent_id: company_id },
      attributes: ['id', 'name', 'default_lang'],
    });

    const finalSubCompanies = [];

    for (const company of subCompanies) {
      const translatedText = await translateWithRetry(
        name,
        company.default_lang,
        this.googleTranslate,
        this.configService.get('MAX_TRANSLATE_ATTEMPT'),
      );

      finalSubCompanies.push({
        ...company.toJSON(),
        type_variation: translatedText,
      });
    }

    return finalSubCompanies;
  }

  async getAllVariantionsOfIncidentType(
    getAllVariationDto: GetAllVariantsDto,
    user: User,
    singleRowId?: number,
  ) {
    const { company_id, sort_column, order, keyword, page, page_size } =
      getAllVariationDto;

    await getCompanyScope(user, company_id);

    let translation_data = null;
    let subCompanyData = null;

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    let rows = null;
    let count = null;

    if (!singleRowId) {
      const incidentTypes = await IncidentType.findAndCountAll({
        where: {
          company_id,
          parent_id: null,
          ...(keyword && {
            name: { [Op.iLike]: `%${keyword.toLowerCase()}%` },
          }),
        },
        attributes: ['id'],
        limit: _page_size || undefined,
        offset: _page_size * _page || undefined,
      });

      rows = incidentTypes.rows;
      count = incidentTypes.count;
    }

    const company = await isCompanyExist(company_id);

    const getAllIncidentTypesAndTranslations = IncidentType.findAll({
      where: {
        company_id,
        parent_id: null,
        id: {
          [Op.in]: singleRowId
            ? [singleRowId]
            : rows.map((incidentType) => incidentType.id),
        },
        ...(keyword &&
          singleRowId && {
            name: { [Op.iLike]: `%${keyword.toLowerCase()}%` },
          }),
      },
      attributes: ['id', 'name'],
      include: [
        {
          model: IncidentTypeTranslation,
          as: 'incident_type_translations',
          attributes: ['id', 'language', 'translation'],
          where: {
            language: {
              [Op.eq]: company.default_lang,
            },
          },
        },
        {
          model: IncidentType,
          as: 'variations',
          attributes: ['id', 'name'],
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'default_lang'],
            },
            {
              model: IncidentTypeTranslation,
              as: 'incident_type_translations',
              attributes: ['id', 'language', 'translation'],
              where: {
                language: {
                  [Op.eq]: Sequelize.col('variations->company.default_lang'),
                },
              },
            },
          ],
        },
      ],
    });

    const getAllSubCompanies = Company.findAll({
      where: {
        parent_id: company_id,
      },
      attributes: ['id', 'name', ['default_lang', 'language']],
      order: [['name', SortBy.ASC]],
    });

    try {
      const [incidentTypesAndTranslations, subCompanies] = await Promise.all([
        getAllIncidentTypesAndTranslations,
        getAllSubCompanies,
      ]);

      const formattedData = incidentTypesAndTranslations.map((core) => {
        const variations = core.variations || [];

        const mergedSubCompanies = [];

        variations.map((variation) => {
          const foundCompany = mergedSubCompanies.find(
            (item) =>
              item.id == variation.company.id &&
              item.name == variation.company.name,
          );
          if (foundCompany) {
            foundCompany.translations.push(
              ...variation.incident_type_translations.map((trans) => ({
                id: trans.id,
                translation: trans.translation,
                incident_type_id: variation.id,
              })),
            );
          } else
            mergedSubCompanies.push({
              // sub company id, name and default lang
              id: variation.company.id,
              name: variation.company.name,
              language: variation.company.default_lang,
              // variations of sub incident type
              translations: variation.incident_type_translations.map(
                (trans) => ({
                  id: trans.id,
                  translation: trans.translation,
                  incident_type_id: variation.id,
                }),
              ),
            });
        });

        // sorting to map in a sorted manner on frontend
        // mergedSubCompanies.sort((a, b) => a.name - b.name);

        return {
          // core incident type name and id
          id: core.id,
          name: core.incident_type_translations[0].translation,

          // max number of variations sub incident type can have required by frontend to iterate
          max_variations: Math.max(
            ...mergedSubCompanies.map((v) => v.translations?.length),
            1,
          ),
          // total number of variations of all sub incident types
          variants: variations.reduce(
            (sum, v) => sum + v.incident_type_translations?.length,
            0,
          ),

          // formatting data
          sub_companies: mergedSubCompanies,
        };
      });

      // sorting on variable count or name or default asc or desc
      if (sort_column === IncidentTypeSortingColumns.VARIABLE)
        if (order === SortBy.DESC)
          formattedData.sort((a, b) => b.variants - a.variants);
        else formattedData.sort((a, b) => a.variants - b.variants);
      else if (sort_column === IncidentTypeSortingColumns.NAME) {
        if (order === SortBy.DESC)
          formattedData.sort((a, b) => b.name.localeCompare(a.name));
        else formattedData.sort((a, b) => a.name.localeCompare(b.name));
      } else formattedData.sort((a, b) => a.name.localeCompare(b.name));

      translation_data = formattedData;
      subCompanyData = subCompanies;
    } catch (error) {
      console.log('🚀 ~ IncidentTypeManagement ~ error:', error);
      throwCatchError(error);
    }

    return {
      data: { translation_data, sub_companies: subCompanyData },
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getIncidentTypeTranslationsChangelogs(
    getIncidentTranslationChangelogDto: GetIncidentTranslationChangelogDto,
    user: User,
  ) {
    const {
      page,
      page_size,
      company_id,
      sub_company_ids = [],
      incident_type_ids = [],
    } = getIncidentTranslationChangelogDto;

    await getCompanyScope(user, company_id);

    const { data, pagination } = await this.changeLogService.getChangeLogs({
      id: company_id,
      types: [PolymorphicType.INCIDENT_TYPE],
      page,
      page_size,
      where: incidentTranslationChangeLogWhere(
        sub_company_ids,
        incident_type_ids,
      ),
    });

    const translatedChangelogs =
      await this.translateService.translateChangeLogs(
        user,
        data,
        PolymorphicType.INCIDENT_TYPE,
      );

    return {
      data: translatedChangelogs,
      pagination,
    };
  }

  async getSingleCoreIncidentTypeData(
    id: number,
    company_id: number,
    user: User,
  ) {
    return await this.getAllVariantionsOfIncidentType(
      { company_id } as GetAllVariantsDto,
      user,
      id,
    );
  }

  async getCount(getCountDto: GetCountDto, user: User) {
    const { company_id, keyword } = getCountDto;

    await getCompanyScope(user, company_id);

    // Fetch core incident types count directly from DB
    const coreIncidentTypes = await IncidentType.findAll({
      where: {
        company_id,
        parent_id: null,
        ...(keyword && {
          name: { [Op.iLike]: `%${keyword.toLowerCase()}%` },
        }),
      },
      attributes: ['id'],
    });

    // Fetch sub-companies
    const subCompanies = await Company.findAll({
      where: { parent_id: company_id },
      attributes: ['id', 'name'],
      order: [['name', SortBy.ASC]],
    });

    // If no sub-companies, return early
    if (!subCompanies.length) {
      return {
        coreIncidentTypeCount: coreIncidentTypes.length,
        subIncidentTypeCount: {},
      };
    }

    // Fetch sub-incident types count grouped by company_id
    const subIncidentTypes = await IncidentType.findAll({
      where: {
        company_id: { [Op.in]: subCompanies.map(({ id }) => id) },
        parent_id: {
          [Op.in]: coreIncidentTypes.map(
            (coreIncidentType) => coreIncidentType.id,
          ),
        },
      },
      attributes: ['company_id'],
    });

    // Count incidents per sub-company
    const sub_incident_types_count = subCompanies.reduce(
      (acc, { id }) => {
        acc[id] = subIncidentTypes.filter(
          ({ company_id }) => company_id === id,
        ).length;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      core_incident_types_count: coreIncidentTypes.length,
      sub_incident_types_count,
    };
  }
}
