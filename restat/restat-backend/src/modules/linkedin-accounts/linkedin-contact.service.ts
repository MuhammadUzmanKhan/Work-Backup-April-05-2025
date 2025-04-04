import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { LinkedinAccountsData } from "src/common/models/linkedin-account-data.model";
import { LinkedinAccountsDto } from "./dto/linkedin-accounts.dto";
import { InstitutionDto } from "./dto/institution.dto";
import { InstitutionService } from "../institutions/institution.service";
import { EducationDto } from "./dto/education.dto";
import { EducationService } from "../education/education.service";
import { EducationEntityDto } from "../education/dto/education.dto";
import { SkillDto } from "../skills/dto/skill.dto";
import { SkillService } from "../skills/skill.service";
import { LinkedinAccountCompanyDto } from "../linkedin-account-companies/dto/linkedin-account-company.dto";
import { ExperienceDto } from "./dto/experience.dto";
import * as moment from "moment";
import { Op, Sequelize } from "sequelize";
import { Users } from "src/common/models/users.model";
import { DateProps } from "../bids/bids-jobs-accounts.service";
import { ROLES } from "src/common/constants/roles";
import { ConfigService } from "@nestjs/config";
import pg from "pg";
import { LINKEDIN_CONNECTION_TYPE } from "src/common/constants/linkedin";
import { Profiles } from "src/common/models/profiles.model";
import { Industries } from "src/common/models/industries.model";
import { Education } from "src/common/models/education.model";
import { Institutions } from "src/common/models/institutions.model";
import { LinkedinAccountSkills } from "src/common/models/linkedin-account-skills.model";
import { Skills } from "src/common/models/skills.model";
import { Experience } from "src/common/models/experience.model";
import { LinkedinAccountCompanies } from "src/common/models/linkedin-account-companies.model";
import { IntegrationsServiceHubspot } from "../integrations/hubspot/hubspot.service";
import { CreateFieldProps, INTEGRATION_OPTION } from "src/types/integrations";
import { IMessage } from "src/types/bids";
import { formatMessages } from "src/common/helpers";
import { DynamicModelsProvider } from "src/common/mongo-collections/dynamic-models.provider";
import { SOURCE } from "src/common/constants/source";
import ShortUniqueId from "short-unique-id";
import { ContactService } from "../contacts/contacts.service";
import { Contacts } from "src/common/models/contacts.model";
import { CompaniesService } from "../companies/companies.service";
import { DealLogsService } from "../deal-logs/deal-logs.service";
import { CreateAccountLogDto } from "../deal-logs/dto/create-account-log.dto";
import { ACCOUNT_LOG_TYPE } from "src/common/constants/bids";
import { IContact } from "src/types/contact";
import { LinkedinReferences } from "src/common/models/linkedin-reference";
import { linkedinContactMessages } from "src/common/constants/messages";

interface ICompanyInfo {
  name: string;
  location: string;
}

const getLinkedInRestatFields = ({ reference, contact, companyInfo, industryName }: { reference: LinkedinReferences, contact: Contacts, companyInfo: ICompanyInfo, industryName: string }): CreateFieldProps => {

  let fullName = contact.name;
  let lastSpaceIndex = fullName.lastIndexOf(' ');
  let firstName = fullName.substring(0, lastSpaceIndex);
  let lastName = fullName.substring(lastSpaceIndex + 1);

  return {
    fullName,
    firstName,
    lastName,
    profileHeadline: contact.profileHeadline,
    location: contact.location,
    connectionDate: moment(reference.linkedinConnectedDate).valueOf(),
    connectionsCount: contact.linkedinConnections,
    followers: contact.linkedinFollowers,
    email: contact.email,
    phone: contact.phoneNumber,
    website: contact.websites?.join(', '),
    linkedinProfile: contact.linkedinProfileLink,
    industry: industryName,
    latestCompanyName: companyInfo.name,
    latestCompanyLocation: companyInfo.location,
  }
}

@Injectable()
export class LinkedinAccountInstitutionDegreeService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly educationService: EducationService,
    private readonly skillService: SkillService,
    private readonly configService: ConfigService,
    private readonly integrationServiceHubspot: IntegrationsServiceHubspot,
    private readonly dynamicModelsProvider: DynamicModelsProvider,
    private readonly contactService: ContactService,
    private readonly workspaceService: CompaniesService,
    private readonly dealLogsService: DealLogsService,
  ) { }

  public async syncRawHtml(bidProfile: string, linkedinProfileUrl: string, userId: string, rawHtml: string, contactInfoPopupRawHtml: string) {
    const companiesModel = this.dynamicModelsProvider.getCompaniesModel();
    const existingDocument = await companiesModel.findOne({ linkedinProfileUrl, bidProfile }).exec();
    if (existingDocument) {
      existingDocument.rawHtml = rawHtml;
      existingDocument.contactInfoPopupRawHtml = contactInfoPopupRawHtml;
      await existingDocument.save();
    } else {
      await companiesModel.create({
        source: SOURCE.LINKEDIN,
        bidProfile,
        linkedinProfileUrl,
        userId,
        rawHtml,
        contactInfoPopupRawHtml
      });
    }
  }

  public async syncConnectAndSyncProspect(
    user: Users,
    { linkedinAccountDto }: { linkedinAccountDto: LinkedinAccountsDto }
  ) {
    const {
      bidProfile,
      isConnected,
      name,
      connections,
      followers,
      location,
      profileHeadline,
      contactInfo,
      industry,
      education,
      skills,
      experience,
      rawHtml,
      contactInfoPopupRawHtml,
      locationCountry,
      locationState
    } = linkedinAccountDto;

    const {
      address,
      birthday,
      connected,
      email,
      linkedinProfileLink,
      phone,
      twitter,
      websites,
    } = contactInfo;

    const contactData: IContact = {
      name,
      email,
      linkedinConnected: isConnected,
      linkedinConnectedDate: connected,
      linkedinConnections: connections,
      linkedinFollowers: followers,
      locationCountry,
      locationState,
      location,
      profileHeadline,
      address,
      birthday,
      phoneNumber: phone,
      websites,
    }

    if (rawHtml) {
      this.syncRawHtml(bidProfile, contactInfo.linkedinProfileLink, user.id, rawHtml, contactInfoPopupRawHtml)
    }

    // 1: Create OR Find Contact
    const { contact, reference, isAlreadyExist: isContactAlreadyExist } = await this.contactService.createOrUpdateLinkedInContact({ user, linkedinProfileLink, linkedinProfileId: bidProfile, industryId: industry, contactData, twitter })

    await this.dealLogsService.createAccountLog({
      userId: user.id,
      contactId: contact.id,
      contactLogType: isContactAlreadyExist ? ACCOUNT_LOG_TYPE.ACCOUNT_UPDATED : ACCOUNT_LOG_TYPE.ACCOUNT_CREATED,
      message: isConnected ? `Prospect Synced` : `Contact Synced.`,
    } as CreateAccountLogDto);



    // 2: Create Education
    await this.createContactEducation(education, contact);

    // 3: Create Skills
    await this.createContactSkills(skills, contact);

    // 4: Create Experience
    await this.createContactExperience(experience, contact, user.companyId);

    const { monthStart, dayStart, dayEnd } = linkedinAccountDto

    const { thisMonthConnections, thisDayConnections, thisMonthProspects, thisDayProspects } = await this.contactService.countLinkedInConnections(user.id, monthStart, dayStart, dayEnd)

    try {
      const companyInfo: ICompanyInfo = {
        name: '',
        location: ''
      }
      if (experience.length) {
        const latestExperience = experience?.length && experience[0]
        companyInfo.name = latestExperience?.company
        companyInfo.location = latestExperience?.location
        if (Array.isArray(latestExperience?.title)) {
          companyInfo.location = latestExperience?.location ?? latestExperience.title[0]?.location
        }
      }

      if (isContactAlreadyExist) {
        const industryName: string = (await Industries.findByPk(reference.industryId))?.name
        const message: IMessage[] = [{ success: true, message: linkedinContactMessages.linkedinContactUpdateUnderIndustry(industryName) }];

        const hubspotContactId = contact.hubspotContactId
        if (hubspotContactId) {
          // Update
          const hubspotDeal = await this.integrationServiceHubspot.updateHubspotEntities(
            getLinkedInRestatFields({ reference, contact, companyInfo, industryName }),
            user.companyId,
            INTEGRATION_OPTION.LINKEDIN,
            hubspotContactId,
          )
          hubspotDeal.message && message.push({ success: hubspotDeal.status, message: hubspotDeal.message });

        } else {
          // Create
          const hubspotDeal = await this.integrationServiceHubspot.createHubspotEntities(
            getLinkedInRestatFields({ reference, contact, companyInfo, industryName }),
            user.companyId,
            INTEGRATION_OPTION.LINKEDIN,
          )

          if (hubspotDeal.status) {
            contact.hubspotContactId = hubspotDeal.data?.contactId
            await contact.save()
          }
          hubspotDeal.message && message.push({ success: hubspotDeal.status, message: hubspotDeal.message });
        }

        return {
          message: formatMessages(message),
          status: 200,
          thisMonthConnections,
          thisDayConnections,
          thisMonthProspects,
          thisDayProspects,
          contact,
        };
      }

      const industryName: string = (await Industries.findByPk(reference.industryId))?.name
      const message: IMessage[] = [{ success: true, message: linkedinContactMessages.linkedinContactCreateUnderIndustry(industryName) }];

      const hubspotDeal = await this.integrationServiceHubspot.createHubspotEntities(
        getLinkedInRestatFields({ reference, contact, companyInfo, industryName }),
        user.companyId,
        INTEGRATION_OPTION.LINKEDIN,
      )

      if (hubspotDeal.status) {
        contact.hubspotContactId = hubspotDeal.data?.contactId
        await contact.save()
      }

      hubspotDeal.message && message.push({ success: hubspotDeal.status, message: hubspotDeal.message });
      return {
        message: formatMessages(message),
        status: 201,
        thisMonthConnections,
        thisDayConnections,
        thisMonthProspects,
        thisDayProspects,
        contact,
      };
    } catch (err) {
      console.error(linkedinContactMessages.synceLinkedinProspectError, err);
      throw new InternalServerErrorException(err);
    }
  }

  public async createContactEducation(
    education: EducationDto[],
    contact: Contacts,
  ) {
    for (const ele of education) {
      const institutionDto: InstitutionDto = {
        name: ele.name,
      };

      const { institution } = await this.institutionService.createInstitution({
        institutionDto,
      });

      const educationDto: EducationEntityDto = {
        contactId: contact.id,
        institutionId: institution.id,
        duration: ele.duration,
        degree: ele.degree,
      };

      await this.educationService.createEducation({ educationDto });
    }
  }

  public async createContactSkills(skillsList: SkillDto[], contact: Contacts) {
    const { skills } = await this.skillService.createSkills(skillsList);
    try {
      if (skills) {
        const contactSkills = await contact.getContactSkills(contact.id);
        const contactSkillIds = contactSkills.map((skill: any) => skill.skillId);
        const skillIds = skills.map((skill) => skill.id);

        const skillsToDelete = contactSkills.filter((skill: any) => !skillIds.includes(skill.skillId));
        await contact.deleteContactSkills(skillsToDelete);

        const skillsToAdd = skills.filter((skill) => !contactSkillIds.includes(skill.id));
        await contact.assignContactSkills(skillsToAdd);
      }
    } catch (err) {
      console.error(linkedinContactMessages.contactSkillCreateError, err);
      throw new InternalServerErrorException(err);
    }
  }

  public async createContactExperience(experience: ExperienceDto[], contact: Contacts, workspaceId: string) {
    for (const ele of experience) {
      let companyDto: LinkedinAccountCompanyDto = null;

      if (Array.isArray(ele.title)) {
        let location = "";

        for (const el of ele.title) {
          // If the location in each experience object is non-empty, then save it as the location of company
          // see the structure of experience array
          if (ele.location !== "") {
            location = ele.location;
            // if the location inside the title array is not empty, then save it as location of the company
          } else if (el.location !== "") {
            location = el.location;
          }

          companyDto = {
            name: ele.company,
            location,
          };

          await this.workspaceService.createOrFindContactCompany(
            workspaceId,
            contact.id,
            companyDto.name,
            companyDto.location,
            {
              duration: el.duration,
              totalDuration: ele.duration,
              title: el.title
            })

        }
      } else {

        companyDto = {
          name: ele.company,
          location: ele.location,
        };

        await this.workspaceService.createOrFindContactCompany(
          workspaceId,
          contact.id,
          companyDto.name,
          companyDto.location,
          {
            duration: ele.duration,
            totalDuration: '',
            title: ele.title
          })
      }
    }
  }

  async countLinkedinConnectsForDashboard(user: Users, dates: DateProps, bidderId?: string) {
    try {
      let userIds: string[] = [];
      userIds = await this.getUserIds(user, false, bidderId ? [bidderId] : []);

      if (!userIds.length) {
        return {
          connectsCountByBusinessDeveloper: [],
          industryConnectsCounts: [],
        };
      }

      const sequelize = new Sequelize({
        dialect: "postgres",
        host: this.configService.get("DB_HOST"),
        port: this.configService.get("DB_PORT"),
        username: this.configService.get("DB_USERNAME"),
        password: this.configService.get("DB_PASSWORD"),
        database: this.configService.get("DB_DATABASE"),
        dialectModule: pg,
        dialectOptions: +this.configService.get("SSL") ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          }
        } : {},
      });

      const connects_and_prospects_count = `
      SELECT
                  COALESCE ( COUNT(*), 0) AS "connectsCount",
                  COALESCE( COUNT(CASE WHEN "linkedinConnected" = TRUE THEN 1 END) , 0) AS "prospectsCount" 
                  FROM
                     "linkedin-references"
                  WHERE
                      "userId" IN (:userIds)
                      AND "deletedAt" IS NULL
                     ${dates.startDate && dates.endDate
          ? `AND "createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""}
      `

      const industry_connects_counts = `
                    WITH user_counts AS (
                      SELECT 
                        i."name" AS industry,
                        u."name" AS bidder_name,
                        u."deletedAt" as bidderDeletedAt,
                        COUNT(*) AS connects_count
                      FROM "linkedin-references" ref
                      JOIN industries i ON ref."industryId" = i.id
                      JOIN "users" u ON ref."userId" = u."id"
                      WHERE 
                        ref."deletedAt" IS NULL 
                        AND ref."userId" IN (:userIds)
                        ${dates.startDate && dates.endDate
          ? `AND ref."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""}
                      GROUP BY i."name", u."name" , u."deletedAt"
                      ORDER BY connects_count DESC
                    ),

                    industry_totals AS (
                      SELECT 
                        industry,
                        SUM(connects_count) AS total_connects,
                        jsonb_agg (
                          jsonb_build_object (
                            'name', COALESCE(bidder_name, ''),
                            'deletedAt', COALESCE(bidderDeletedAt, NULL),
                            'connectsCount', COALESCE(connects_count, 0)
                          )
                        ) AS users
                      FROM user_counts
                      GROUP BY industry
                    )

                    SELECT 
                      COALESCE (
                        jsonb_agg (
                          jsonb_build_object (
                            'industry', industry,
                            'users', users
                          ) ORDER BY total_connects DESC
                        ),
                        '[]'
                      ) AS result
                    FROM industry_totals
      `

      const linkedin_connections_by_profile = `
      SELECT 
        COALESCE(jsonb_agg(jsonb_build_object(
          'name', COALESCE(subquery_alias.profile_name, ''), 
          'deletedAt', COALESCE(subquery_alias.profile_deleted_at, NULL),
          'connectionsCount', COALESCE(subquery_alias.connectionsCount, 0),
          'prospectCount', COALESCE(subquery_alias.prospectCount, 0)
        )), '[]') AS "connectsCountByProfile"
      FROM (
        SELECT 
          P.NAME AS profile_name,
          P."deletedAt" AS profile_deleted_at,
          COUNT(CASE WHEN lr."linkedinConnected" = TRUE THEN 1 END) AS prospectCount,
          COUNT(*) FILTER (WHERE lr."deletedAt" IS NULL) AS connectionsCount
        FROM
          "linkedin-references" lr
          JOIN "profiles" P ON lr."linkedinProfileId" = P."id"
        WHERE
          lr."userId" IN (:userIds)
          ${dates.startDate && dates.endDate ? `AND lr."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'` : ''}
        GROUP BY
          P.NAME,
          P."deletedAt"
        ORDER BY
          connectionsCount DESC
      ) subquery_alias
    `;



      const linkedin_connections_by_month = `
            SELECT
              DATE_TRUNC('month', lr."createdAt") AS month,
              COUNT(*) AS connectionsCount,
              COUNT(CASE WHEN lr."linkedinConnected" = TRUE THEN 1 END) AS prospectsCount
            FROM "linkedin-references" lr
            WHERE
              lr."deletedAt" IS NULL
              AND lr."userId" IN (:userIds)
              ${dates.startDate && dates.endDate ? `AND lr."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'` : ''}
            GROUP BY
              DATE_TRUNC('month', lr."createdAt")
            ORDER BY
              month
        `;

      const connections_by_country = `
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'state', contacts.state, 
            'connectionsCount', COALESCE(contacts.connectionsCount, 0),
            'prospectsCount', COALESCE(contacts.prospectsCount, 0)
          )) FILTER (WHERE contacts.state IS NOT NULL), '[]') as "connectionsCountByState"
          FROM (
            SELECT
              a."locationCountry" AS state,
              COUNT(*) AS connectionsCount,
              COUNT(CASE WHEN lr."linkedinConnected" = TRUE THEN 1 END) AS prospectsCount
            FROM
              "linkedin-references" lr
            INNER JOIN
              "contacts" a ON a."id" = lr."contactId"
              AND ( a."locationCountry" IS NOT NULL OR a."locationCountry" != '' )
            WHERE
              lr."deletedAt" IS NULL
              AND lr."userId" IN (:userIds)
              ${dates.startDate && dates.endDate
          ? `AND lr."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""}
            GROUP BY
              a."locationCountry" 
            ORDER BY
              connectionsCount DESC
          ) contacts
        `

      const targetQuery = `
      WITH target_calculations AS (
              SELECT
                u.id AS user_id,
                u.NAME AS NAME,
                u."deletedAt" as bidderDeletedAt,
                COALESCE ( COUNT(ref.*), 0 ) AS connects_count,
                SUM(CASE WHEN ref."linkedinConnected" = TRUE THEN 1 ELSE 0 END) AS prospects_count,
                uth."target",
                uth."validFrom",
                uth."validTo",
                u."createdAt"

               FROM "linkedin-references" ref
              JOIN 
                "users" u ON ref."userId" = u."id"
              LEFT JOIN 
                "user-target-history" uth ON u."id" = uth."userId" AND uth.type = '${SOURCE.LINKEDIN}'
              WHERE
                ref."deletedAt" IS NULL 
                AND ref."userId" IN (:userIds)
                ${dates.startDate && dates.endDate
          ? `AND ref."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
              GROUP BY
                u.id, u.NAME, u."deletedAt", uth."target", uth."validFrom", uth."validTo", u."createdAt"
            ),

      month_targets AS (
              SELECT
                name,
                bidderDeletedAt,
                connects_count,
                prospects_count,
                SUM(
                  CASE
                      WHEN 
                        ("validTo" IS NULL) AND (('${dates.startDate}' BETWEEN "validFrom" AND '${moment().toISOString()}') OR ('${dates.endDate}' BETWEEN "validFrom" AND '${moment().endOf('month').toISOString()}') )
                      THEN
                        EXTRACT(YEAR FROM DATE_TRUNC('month', '${dates.endDate}'::timestamp)) * 12 + EXTRACT(MONTH FROM DATE_TRUNC('month', '${dates.endDate}'::timestamp))
                        - EXTRACT(YEAR FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(dates.startDate).add(10, 'hour').toISOString()}') )) * 12 - EXTRACT(MONTH FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(dates.startDate).add(10, 'hour').toISOString()}') )) + 1
                     
                      WHEN 
                        ('${dates.startDate}' BETWEEN "validFrom" AND COALESCE("validTo", '${moment().toISOString()}')) OR ("validTo" BETWEEN '${dates.startDate}' AND '${dates.endDate}')
                      THEN
                        EXTRACT(YEAR FROM DATE_TRUNC('month', LEAST("validTo", '${dates.endDate}')::timestamp)) * 12 + EXTRACT(MONTH FROM DATE_TRUNC('month', LEAST("validTo", '${dates.endDate}')::timestamp))
                        - EXTRACT(YEAR FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(dates.startDate).add(10, 'hour').toISOString()}')::timestamp)) * 12 - EXTRACT(MONTH FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(dates.startDate).add(10, 'hour').toISOString()}')::timestamp)) + 1
                  END * "target"
                ) AS "target"
              FROM
                target_calculations
              GROUP BY
                NAME, bidderDeletedAt, connects_count, prospects_count
              ORDER BY connects_count DESC
            )
    
      SELECT
            jsonb_agg(
              jsonb_build_object(
                'name', NAME,
                'deletedAt', bidderDeletedAt,
                'connectsCount', connects_count,
                'prospectsCount', prospects_count,
                'target', "target"
              )
            ) AS result
          FROM
            month_targets
      `

      const query = `
        WITH 
        connects_and_prospects_count AS (${connects_and_prospects_count}),

        industry_connects_counts AS (${industry_connects_counts}),

        target_connects_count AS (${targetQuery}),

        connections_by_country AS (${connections_by_country}),

        linkedin_connections_by_profiles AS (${linkedin_connections_by_profile}),

        linkedin_connections_by_month AS (${linkedin_connections_by_month})

        SELECT 
          jsonb_build_object(
            'connectsCount', (SELECT "connectsCount" FROM connects_and_prospects_count),
            'prospectsCount', (SELECT "prospectsCount" FROM connects_and_prospects_count),
            'connectsCountByBusinessDeveloper', (SELECT result FROM target_connects_count),
            'industryConnectsCounts', (SELECT result FROM industry_connects_counts),
            'connectionsCountByState', (SELECT "connectionsCountByState" FROM connections_by_country),
            'connectsCountByProfile', (SELECT "connectsCountByProfile" FROM linkedin_connections_by_profiles),
            'monthlyConnectionData', (SELECT COALESCE(jsonb_agg( jsonb_build_object
                  (
                    'month', TO_CHAR(month, 'Mon - YYYY'),
                    'connectionsCount', connectionsCount,
                    'prospectsCount', prospectsCount
                  )
                ), '[]') FROM linkedin_connections_by_month)
            ) as results
          `;

      const replacements = { userIds };
      const results: any = await sequelize.query(query, { replacements });
      const data = results[0][0]["results"];
      return {
        message: linkedinContactMessages.linkedinStatsFetched,
        ...data,
      };
    } catch (error) {
      console.error(linkedinContactMessages.linkedinStatsError, error);
      throw new InternalServerErrorException(linkedinContactMessages.linkedinStatsError + ', Internal Server Error');
    }
  }

  public async getLinkedinListing(
    user: Users,
    search: string,
    profile: string[],
    page: number,
    bidderId: string[],
    industries: string[],
    type: LINKEDIN_CONNECTION_TYPE,
    dates?: DateProps,
    perPage: string = '20',
    slug?: string,
  ) {
    const perPageCount = +perPage;
    const offset = (page - 1) * perPageCount;

    const userIds = await this.getUserIds(user, true, bidderId);

    const whereQuery: any = {
      userId: userIds,
      ...(profile && { linkedinProfileId: profile }),
      ...((dates?.startDate && dates?.endDate) && {
        createdAt: {
          [Op.between]: [dates.startDate, dates.endDate]
        }
      })
    };

    if (type === LINKEDIN_CONNECTION_TYPE.CONNECTION) {
      whereQuery.isConnected = false;
    } else if (type === LINKEDIN_CONNECTION_TYPE.PROSPECT) {
      whereQuery.isConnected = true;
    }

    if (search) {
      whereQuery[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { profileHeadline: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (slug) {
      const linkedinAccount = await LinkedinAccountsData.findOne({
        where: {
          slug: slug,
          userId: userIds
        }
      });
      if (!linkedinAccount) throw new NotFoundException(linkedinContactMessages.linkedinAccountsNotFound);

      whereQuery.slug = slug;
    }

    let includeOptions: any[] = [
      {
        model: Industries,
        attributes: ["name"],
        ...(industries?.length > 0 && { where: { id: industries } })
      },
      {
        model: Users,
        attributes: ["name", "deletedAt"],
        paranoid: false,
      },
      {
        model: Profiles,
        attributes: ["name"],
      },
      {
        model: Experience,
        attributes: ['duration', 'totalDuration', 'title'],
        include: [
          {
            model: LinkedinAccountCompanies,
            attributes: ["name", "location"],
          }
        ]
      },
      {
        model: Education,
        attributes: ["duration", "degree"],
        order: [['createdAt', 'ASC']],
        include: [
          {
            model: Institutions,
            attributes: ["name"],
          }
        ]
      },
      {
        model: LinkedinAccountSkills,
        attributes: ['id'],
        include: [
          {
            model: Skills,
            attributes: ['name']
          }
        ]
      },
    ];


    const accountsCount = await LinkedinAccountsData.count({
      where: whereQuery,
      include: [
        {
          model: Industries,
          attributes: ["name"],
          ...(industries?.length > 0 && { where: { id: industries } })
        },
      ]
    });

    const totalPages = Math.ceil(accountsCount / perPageCount);


    // Fetching the paginated results
    const data = await LinkedinAccountsData.findAll({
      where: whereQuery,
      order: [['connectTime', 'DESC'], ["updatedAt", "DESC"]],
      limit: perPageCount,
      offset,
      include: includeOptions,
    });

    return {
      message: linkedinContactMessages.linkedinListFetched(type),
      data,
      page,
      totalPages,
      perPageCount,
      accountsCount,
    };
  }

  async getUserIds(user: Users, allowAll: boolean, bidderIds?: string[]) {
    if (user.role === ROLES.BIDDER && !allowAll) {
      return [user.id];
    } else if (user.role === ROLES.COMPANY_ADMIN || ROLES.OWNER || allowAll) {
      if (bidderIds?.length) {
        return bidderIds;
      }
      const users = await Users.findAll({
        where: {
          companyId: user.companyId,
          role: {
            [Op.in]: [ROLES.BIDDER, ROLES.COMPANY_ADMIN, ROLES.OWNER]
          }
        },
        attributes: ["id"],
        paranoid: false,
      });
      return users?.map((user: Users) => user.id);
    } else return [];
  }

  async generateSlugs() {
    const linkedinAccounts = await LinkedinAccountsData.findAll();

    let slug: string;
    let isUnique = false;
    let attempts = 0;
    let slugLength = 8;

    for (const linkedinAccount of linkedinAccounts) {
      do {
        slug = new ShortUniqueId().randomUUID(slugLength);
        const existingSlug = await LinkedinAccountsData.findOne({ where: { slug } });
        if (!existingSlug) {
          isUnique = true;
        } else {
          attempts++;
          if (attempts >= 3) {
            slugLength += 1;
          }
        }
      } while (!isUnique);

      linkedinAccount.slug = slug;
      await linkedinAccount.save();
    }

    return {
      message: "Slugs are successfully generated for linkedin accounts",
    };
  }

}
