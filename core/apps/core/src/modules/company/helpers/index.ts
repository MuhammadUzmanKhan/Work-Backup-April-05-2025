import moment from 'moment-timezone';
import { Op, Transaction } from 'sequelize';
import { Response, Request } from 'express';
import { catchError, firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  Company,
  CompanyContact,
  LegalGroup,
  User,
} from '@ontrack-tech-group/common/models';
import {
  ContactType,
  CsvOrPdf,
  ERRORS,
  PdfTypes,
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import {
  getFormattedCompanyDataForCsv,
  getFormattedCompanyDataForPdf,
  getFormattedsubcompanyDataForCsv,
  getFormattedSubcompanyDataForPdf,
  getRegionsAndSubRegions,
  successInterceptorResponseFormat,
  userRegionsWhere,
} from '@ontrack-tech-group/common/helpers';
import {
  getReportsFromLambda,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { DashboardDropdownsQueryDto } from '@Common/dto';
import {
  CompanySubcompanyFilterDto,
  GetCompanyByIdDto,
  GetCompanyDto,
  LegalContactDto,
  SubcompaniesWithEvents,
  SubcompaniesWithEventsAndCategory,
  SecondaryContactDto,
} from '../dto';

export const getAllCompaniesWhereQuery = async (
  params: CompanySubcompanyFilterDto,
  user: User,
  companyAndSubcompaniesIds?: number[],
) => {
  const { country, category, keyword, region_ids, demo_company } = params;
  let _where = {};
  let regionsAndSubRegions: number[];

  if (companyAndSubcompaniesIds?.length)
    _where['id'] = { [Op.in]: companyAndSubcompaniesIds };

  if (country)
    _where['country'] = {
      [Op.iLike]: `%${country.toLowerCase()}%`,
    };

  if (typeof category === 'object' && category?.length) {
    _where['category'] = { [Op.in]: category };
  } else if (category) {
    _where['category'] = category;
  }

  if (keyword) {
    _where[Op.and] = [
      {
        [Op.or]: [
          { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
          { country: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
          { '$parent.name$': { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        ],
      },
    ];
  }

  if (region_ids) {
    regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);
  }

  if (regionsAndSubRegions?.length) {
    _where['region_id'] = {
      [Op.in]: regionsAndSubRegions,
    };
  } else if (user)
    _where = { ..._where, ...(await userRegionsWhere(user, false, true)) };

  if (demo_company !== undefined) {
    _where['demo_company'] = demo_company;
  }

  return _where;
};

export const getCompanyWhereQuery = async (
  params:
    | SubcompaniesWithEvents
    | CompanySubcompanyFilterDto
    | GetCompanyDto
    | SubcompaniesWithEventsAndCategory,
  user: User,
) => {
  let _where = {};

  if (params instanceof CompanySubcompanyFilterDto && params?.company_id) {
    _where['id'] = (params as CompanySubcompanyFilterDto).company_id;
  }

  if (params instanceof SubcompaniesWithEvents && params?.company_id) {
    _where = {
      [Op.or]: {
        parent_id: (params as SubcompaniesWithEvents).company_id,
        id: (params as SubcompaniesWithEvents).company_id,
      },
    };

    if (params.subCompany_id) _where['id'] = params.subCompany_id;
  }

  if (params['category']) _where['category'] = params['category'];

  if (params.keyword) {
    _where[Op.and] = [
      {
        [Op.or]: [
          { name: { [Op.iLike]: `%${params.keyword.toLowerCase()}%` } },
          { country: { [Op.iLike]: `%${params.keyword.toLowerCase()}%` } },
          {
            '$events.name$': {
              [Op.iLike]: `%${params.keyword.toLowerCase()}%`,
            },
          },
        ],
      },
    ];
  }

  if (params.country)
    _where['country'] = {
      [Op.iLike]: `%${params.country.toLowerCase()}%`,
    };

  if (user)
    _where = {
      ..._where,
      ...(await userRegionsWhere(user, false, true, null, params['category'])),
    };

  if (params['demo_company'] !== undefined) {
    _where['demo_company'] = params['demo_company'];
  }

  return _where;
};

/**
 * This function calls an API to lambda function and get s3 url of pdf
 */
export const generateCompanyDetailPdfAndGetUrl = async (
  company: Company,
  req: Request,
  params: GetCompanyByIdDto,
  httpService,
) => {
  try {
    company = company.get({ plain: true });

    // Mapping timezone in name and utc offset format
    if (company.timezone && company.timezone !== '') {
      company.timezone = `${company.timezone} (UTC ${moment
        .tz(company.timezone)
        .format('Z')})`;
    } else company.timezone = '--';

    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      company,
      CsvOrPdf.PDF,
      company['parentCompanyName']
        ? PdfTypes.SUB_COMPANY_DETAIL
        : PdfTypes.COMPANY_DETAIL,
      params.file_name,
    );
    return response;
  } catch (err) {
    console.log(err);
  }
};

/**
 * This function generate csv as attachment or return with pdf url for universal view
 */
export const generateCsvOrPdfForUniversalCompanies = async (
  params: CompanySubcompanyFilterDto,
  companies: Company[],
  req: Request,
  res: Response,
  totalCompanies: number,
  httpService,
) => {
  const _companies = companies.map((company) => company.get({ plain: true }));
  if (params?.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedCompanyForCsv = getFormattedCompanyDataForCsv(_companies);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedCompanyForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="companies.csv"');
    return res.send(response.data);
  } else if (params?.csv_pdf === CsvOrPdf.PDF) {
    // Formatting data for pdf
    const formattedCompanyForPdf = getFormattedCompanyDataForPdf(_companies);

    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      { data: formattedCompanyForPdf, totalCompanies },
      CsvOrPdf.PDF,
      PdfTypes.COMPANIES_LISTING,
      params.file_name,
    );

    return res.send(successInterceptorResponseFormat(response.data));
  }
};

/**
 * This function generate csv as attachment or return with pdf url for global view
 */
export const generateCsvOrPdfForGlobalCompanies = async (
  params: SubcompaniesWithEvents,
  companies: Company[],
  req: Request,
  res: Response,
  httpService,
) => {
  const _companies = companies.map((company) => company.get({ plain: true }));

  if (params?.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedSubcompanyForCsv =
      getFormattedsubcompanyDataForCsv(_companies);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedSubcompanyForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="subcompanies.csv"');
    return res.send(response.data);
  } else if (params?.csv_pdf === CsvOrPdf.PDF) {
    // Formatting data for pdf
    const formattedsubcompanyForPdf =
      getFormattedSubcompanyDataForPdf(_companies);

    // Api call to lambda for getting pdf
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      { data: formattedsubcompanyForPdf },
      CsvOrPdf.PDF,
      PdfTypes.SUB_COMPANIES_WITH_EVENTS,
      params.file_name,
    );

    return res.send(successInterceptorResponseFormat(response.data));
  }
};

export const saveLocationCoordinates = async (
  location: string,
  httpService: HttpService,
) => {
  try {
    if (location && location != '') {
      const encodedAddress = encodeURIComponent(location);

      const url = `https://maps.googleapis.com/maps/api/geocode/json?key=${process.env.GOOGLE_MAPS_API_KEY}&address=${encodedAddress}`;

      const response = await firstValueFrom(
        httpService.get(url).pipe(
          catchError(() => {
            throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
          }),
        ),
      );
      if (response.status === 200) {
        const { lat, lng } = response.data.results[0].geometry.location;
        return { lat, lng };
      }
    }
  } catch (e) {}

  return {};
};

export const companyNamesWhere = async (
  dashboardDropdownsQueryDto: DashboardDropdownsQueryDto,
  user: User,
) => {
  const { keyword, year, region_ids } = dashboardDropdownsQueryDto;
  let where = {};

  const regionsAndSubRegions = await getRegionsAndSubRegions(region_ids);

  if (year) {
    where['created_at'] = {
      [Op.between]: [
        new Date(`${year}-01-01T00:00:00.000Z`),
        new Date(`${year + 1}-01-01T00:00:00.000Z`),
      ],
    };
  }

  if (keyword) {
    where['name'] = {
      [Op.iLike]: `%${keyword.toLowerCase()}%`,
    };
  }

  if (region_ids) {
    where['region_id'] = { [Op.in]: regionsAndSubRegions };
  }

  where = { ...where, ...(await userRegionsWhere(user, false, true)) };

  return where;
};

export const eventCountWhere = async (
  user: User,
  companyAndSubcompaniesIds: number[],
  globalIds?: boolean,
) => {
  let where = {};

  where['request_status'] = {
    [Op.or]: [
      {
        [Op.notIn]: ['requested', 'denied'],
      },
      { [Op.eq]: null },
    ],
  };

  if (globalIds) where['company_id'] = { [Op.in]: companyAndSubcompaniesIds };

  where = {
    ...where,
    ...(await userRegionsWhere(user, false, false, companyAndSubcompaniesIds)),
  };

  return where;
};

export const isCompanyAlreadyExistWithName = async (
  name: string,
  companyId?: number,
) => {
  const alreadyExistCompany = await Company.findOne({
    where: {
      ...(companyId ? { id: { [Op.ne]: companyId } } : {}),
      name: {
        [Op.iLike]: name,
      },
    },
  });
  if (alreadyExistCompany)
    throw new ConflictException(ERRORS.COMPANY_ALREADY_EXISTS);
};

export const createCompanyContacts = async (
  companyContacts: LegalContactDto[] | SecondaryContactDto[],
  company_id: number,
  transaction: Transaction,
  type?: ContactType,
): Promise<void> => {
  const contactsToCreate = companyContacts.map((contact) => ({
    ...contact,
    company_id,
    type: type ? type : ContactType.LEGAL_CONTACT,
  }));

  await CompanyContact.bulkCreate(contactsToCreate, { transaction });
};

export const createCompanyBulkContacts = async (
  companyContacts: LegalContactDto[] | SecondaryContactDto[],
  company_id: number,
  type: ContactType,
  transaction: Transaction,
): Promise<void> => {
  const contactsToCreate = companyContacts.map((contact) => ({
    ...contact,
    company_id,
    type,
  }));

  await CompanyContact.bulkCreate(contactsToCreate, { transaction });
};

export const updateCompanyLegalContacts = async (
  legalContacts: LegalContactDto[],
  company_id: number,
  transaction: Transaction,
): Promise<void> => {
  if (!legalContacts) return;

  // Fetch existing legal contacts associated with the company
  const existingContacts = await CompanyContact.findAll({
    where: { company_id, type: ContactType.LEGAL_CONTACT },
  });

  // Fetch all legal groups associated with the company
  const legalGroups = await LegalGroup.findAll({
    where: { company_id },
    transaction,
  });

  // Initialize updatedParticipants for each group
  const groupParticipantsMap = new Map(
    legalGroups.map((group) => [group.id, [...group.participants]]),
  );

  if (legalContacts.length === 0) {
    // Remove all external contacts but keep internal participants
    await CompanyContact.destroy({
      where: { company_id, type: ContactType.LEGAL_CONTACT },
      transaction,
    });

    // Remove deleted contacts from each legal group's participants
    for (const legalGroup of legalGroups) {
      const updatedParticipants = legalGroup.participants.filter(
        (email) => !existingContacts.some((c) => c.email === email),
      );

      await LegalGroup.update(
        { participants: updatedParticipants },
        { where: { id: legalGroup.id }, transaction },
      );
    }

    return;
  }

  // Extract IDs from incoming legal contacts
  const toBeUpdateLegalContacts = legalContacts.filter((contact) => contact.id);
  const toBeUpdateLegalContactsIds = toBeUpdateLegalContacts.map(
    (contact) => contact.id,
  );

  // Remove participants only if they exist in `existingContacts`
  const contactsToBeDeleted = existingContacts.filter(
    (contact) => !toBeUpdateLegalContactsIds.includes(contact.id),
  );

  if (contactsToBeDeleted.length) {
    const contactsToBeDeletedIds = contactsToBeDeleted
      .filter((contact) => Number.isInteger(contact.id)) // Ensure only numeric IDs
      .map((contact) => contact.id);

    if (contactsToBeDeletedIds.length) {
      // Prevents invalid delete operation
      await CompanyContact.destroy({
        where: { id: { [Op.in]: contactsToBeDeletedIds } },
        transaction,
      });
    }

    // Remove only the deleted emails from participants of all legal groups
    const deletedEmails = contactsToBeDeleted.map((contact) => contact.email);
    for (const [groupId, participants] of groupParticipantsMap.entries()) {
      groupParticipantsMap.set(
        groupId,
        participants.filter((email) => !deletedEmails.includes(email)),
      );
    }
  }

  // Case: Creating new contacts and updating participants
  const contactsToCreate = legalContacts.filter((contact) => !contact.id);

  if (contactsToCreate.length) {
    await createCompanyBulkContacts(
      contactsToCreate,
      company_id,
      ContactType.LEGAL_CONTACT,
      transaction,
    );

    const contactsToCreateEmails = contactsToCreate.map(
      (contact) => contact.email,
    );

    // Add new contacts to all legal groups
    for (const [groupId, participants] of groupParticipantsMap.entries()) {
      groupParticipantsMap.set(
        groupId,
        Array.from(new Set([...participants, ...contactsToCreateEmails])),
      );
    }
  }

  // Case: Updating existing contacts & handling participants
  await Promise.all(
    toBeUpdateLegalContacts.map(async (legalContact) => {
      const existingContact = existingContacts.find(
        (contact) => contact.id === legalContact.id,
      );

      if (existingContact && existingContact.email !== legalContact.email) {
        // Remove old email from participants before adding the updated one
        for (const [groupId, participants] of groupParticipantsMap.entries()) {
          groupParticipantsMap.set(
            groupId,
            participants.filter((email) => email !== existingContact.email),
          );
        }
      }

      await CompanyContact.update(
        { ...legalContact },
        { where: { id: legalContact.id }, transaction },
      );

      for (const [groupId, participants] of groupParticipantsMap.entries()) {
        groupParticipantsMap.set(
          groupId,
          Array.from(new Set([...participants, legalContact.email])),
        );
      }
    }),
  );

  // Update participants for all legal groups only if they changed
  for (const [groupId, updatedParticipants] of groupParticipantsMap.entries()) {
    await LegalGroup.update(
      { participants: updatedParticipants },
      { where: { id: groupId }, transaction },
    );
  }
};

export const updateCompanySecondaryContacts = async (
  secondaryContacts: SecondaryContactDto[],
  company_id: number,
  transaction: Transaction,
): Promise<void> => {
  if (!secondaryContacts) return;

  // Fetch existing secondary contacts associated with the company
  const existingContacts = await CompanyContact.findAll({
    where: { company_id, type: ContactType.SECONDARY_CONTACT },
  });

  if (secondaryContacts.length === 0) {
    // Remove all secondary contacts
    await CompanyContact.destroy({
      where: { company_id, type: ContactType.SECONDARY_CONTACT },
      transaction,
    });

    return;
  }

  // Extract IDs from incoming secondary contacts
  const toBeUpdateSecondaryContacts = secondaryContacts.filter(
    (contact) => contact.id,
  );
  const toBeUpdateSecondaryContactsIds = toBeUpdateSecondaryContacts.map(
    (contact) => contact.id,
  );

  // Identify contacts to be deleted
  const contactsToBeDeleted = existingContacts.filter(
    (contact) => !toBeUpdateSecondaryContactsIds.includes(contact.id),
  );

  if (contactsToBeDeleted.length) {
    const contactsToBeDeletedIds = contactsToBeDeleted.map(
      (contact) => contact.id,
    );

    await CompanyContact.destroy({
      where: { id: { [Op.in]: contactsToBeDeletedIds } },
      transaction,
    });
  }

  // Case: Creating new contacts
  const contactsToCreate = secondaryContacts.filter((contact) => !contact.id);

  if (contactsToCreate.length) {
    await createCompanyBulkContacts(
      contactsToCreate,
      company_id,
      ContactType.SECONDARY_CONTACT,
      transaction,
    );
  }

  // Case: Updating existing contacts
  if (toBeUpdateSecondaryContacts.length) {
    await Promise.all(
      toBeUpdateSecondaryContacts.map(async (secondaryContact) => {
        await CompanyContact.update(
          { ...secondaryContact },
          {
            where: { id: secondaryContact.id },
            transaction,
          },
        );
      }),
    );
  }
};

export const formatCoordinatesObject = async (
  location: string,
  httpService: HttpService,
) => {
  if (location) {
    const { lat, lng } = await saveLocationCoordinates(location, httpService);

    if (lat && lng) {
      return {
        latitude: lat.toString(),
        longitude: lng.toString(),
      };
    }
  }

  return null;
};

// Attributes for fetching company as these are used in multiple APIs
export const companiesAttributes = [
  'id',
  'name',
  'logo',
  'about',
  'url',
  'location',
  'contact_name',
  'contact_phone',
  'use_pay_fabric_live',
  'active',
  'country',
  'createdAt',
  'parent_id',
  'timezone',
  'contact_email',
  'coordinates',
  'category',
  'region_id',
  'demo_company',
  'default_lang',
];

export const sendUpdatedCompany = (
  data,
  company_id: number,
  pusherService: PusherService,
) => {
  pusherService.sendDataUpdates(
    `${PusherChannels.COMPANY_CHANNEL}-${company_id}`,
    [PusherEvents.COMPANY],
    {
      ...data,
    },
  );
};
