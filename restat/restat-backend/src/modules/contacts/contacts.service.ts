import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Contacts } from 'src/common/models/contacts.model';
import { IContact } from 'src/types/contact';
import { UpdateAccountDto } from '../bids/dto/bid-details.dto';
import { Users } from 'src/common/models/users.model';
import { LinkedinReferenceService } from '../linkedin-reference/linkedin-reference.service';
import { LinkedinReferences } from 'src/common/models/linkedin-reference';
import { SOURCE } from 'src/common/constants/source';
import { ROLES } from 'src/common/constants/roles';
import { Op, Sequelize } from 'sequelize';
import { Profiles } from 'src/common/models/profiles.model';
import { Industries } from 'src/common/models/industries.model';
import { Bids } from 'src/common/models/bids.model';
import { Skills } from 'src/common/models/skills.model';
import { Institutions } from 'src/common/models/institutions.model';
import { Companies } from 'src/common/models/companies.model';
import { ContactExperience } from 'src/common/models/contact-experience.model';
import { ContactEducation } from 'src/common/models/contact-education.model';
import { ContactSkills } from 'src/common/models/contact-skills.model';
import { Jobs } from 'src/common/models/jobs.model';
import { LINKEDIN_CONNECTION_TYPE } from 'src/common/constants/linkedin';
import { DateProps } from '../bids/bids-jobs-accounts.service';
import * as moment from "moment";
import { CreateManualBidDto } from '../bids/dto/manual-bids.dto';
import { ConfigService } from '@nestjs/config';
import pg from "pg";
import { DealLogsService } from '../deal-logs/deal-logs.service';
import { ACCOUNT_LOG_TYPE } from 'src/common/constants/bids';
import { CreateAccountLogDto } from '../deal-logs/dto/create-account-log.dto';
import { countryNames } from "./contryNames"
import { contactsMessages } from 'src/common/constants/messages';
import { IMarketplaceJobPosting } from 'src/types/bids';
@Injectable()
export class ContactService {
    constructor(
        private readonly linkedinReferenceService: LinkedinReferenceService,
        private readonly configService: ConfigService,
        private readonly dealLogsService: DealLogsService,
    ) { }

    public async createManualContact(userId: string, workspaceId: string, jobId: string, { contactName, contactCountry, contactState }: CreateManualBidDto): Promise<{ contact: Contacts, message: string, isAlreadyExist: boolean }> {
        try {
            let contact = await Contacts.findOne({
                where: {
                    workspaceId,
                    jobId
                }
            })

            if (contact) {
                return {
                    message: contactsMessages.contactFound,
                    isAlreadyExist: true,
                    contact,
                }
            }

            contact = await Contacts.create({ name: contactName, jobId, workspaceId, source: SOURCE.UPWORK, locationCountry: contactCountry, locationState: contactState })

            await this.dealLogsService.createAccountLog({
                userId,
                contactId: contact.id,
                contactLogType: ACCOUNT_LOG_TYPE.ACCOUNT_CREATED,
                message: `Contact Created Manually.`,
            } as CreateAccountLogDto);


            return {
                message: contactsMessages.contactCreated,
                isAlreadyExist: false,
                contact,
            }
        } catch (error) {
            console.error(contactsMessages.contactCreatedError, error)
            throw new InternalServerErrorException(error)
        }
    }

    public async createOrFindContactOfWorkspace(userId: string, workspaceId: string, jobId: string, contactData: IContact): Promise<{ contact: Contacts, message: string, isAlreadyExist: boolean }> {
        try {
            let contact = await Contacts.findOne({
                where: {
                    workspaceId,
                    jobId
                }
            })

            if (contact) {
                return {
                    message: contactsMessages.contactFound,
                    isAlreadyExist: true,
                    contact,
                }
            }

            contact = await Contacts.create({ ...contactData, jobId, workspaceId })

            await this.dealLogsService.createAccountLog({
                userId,
                contactId: contact.id,
                contactLogType: ACCOUNT_LOG_TYPE.ACCOUNT_CREATED,
                message: `Contact Created.`,
            } as CreateAccountLogDto);

            return {
                message: contactsMessages.contactCreated,
                isAlreadyExist: false,
                contact,
            }
        } catch (error) {
            console.error(contactsMessages.contactCreated, error)
            throw new InternalServerErrorException(error)
        }
    }

    public async updateContactOfWorkspace(userId: string, workspaceId: string, jobId: string, contactData: IContact): Promise<{ contact: Contacts, message: string }> {
        try {
            let contact = await Contacts.findOne({
                where: {
                    workspaceId,
                    jobId
                }
            })

            if (!contact) {
                // throw new NotFoundException(contactsMessages.contactNotFound)
                contact = await Contacts.create({ ...contactData, jobId, workspaceId })
                await this.dealLogsService.createAccountLog({
                    userId,
                    contactId: contact.id,
                    contactLogType: ACCOUNT_LOG_TYPE.ACCOUNT_CREATED,
                    message: `Contact Created.`,
                } as CreateAccountLogDto);
            } else {
                await contact.update({ ...contactData })
                await this.dealLogsService.createAccountLog({
                    userId,
                    contactId: contact.id,
                    contactLogType: ACCOUNT_LOG_TYPE.ACCOUNT_UPDATED,
                    message: `Contact Updated.`,
                } as CreateAccountLogDto);
            }

            return {
                message: contactsMessages.contactUpdated,
                contact,
            }
        } catch (error) {
            console.error(contactsMessages.contactUpdateError, error)
            throw new InternalServerErrorException(error)
        }
    }

    public async updateContact(contactId: string, contactDto: UpdateAccountDto, dealLogMessage: string[]): Promise<{ contact: Contacts }> {
        const contact = await Contacts.findByPk(contactId, {
            attributes: [
                'id',
                'address',
                'email',
                'historyHired',
                'historyHires',
                'historyHoursBilled',
                'historyInterviews',
                'historyJobsPosted',
                'historyOpenJobs',
                'historyProposals',
                'historyTotalSpent',
                'locationCountry',
                'locationState',
                'name',
                'numReviewsUpwork',
                'paymentMethod',
                'phoneNumber',
                'rating',
                'timeZone',
                'upWorkRating',
            ]
        });
        if (!contact) {
            throw new NotFoundException(contactsMessages.contactNotFound)
        }
        const oldContact = contact.toJSON()
        await contact.update({ ...contactDto })

        Object.keys(contactDto).forEach(key => {
            if (oldContact[key as keyof UpdateAccountDto] !== contactDto[key as keyof UpdateAccountDto] && oldContact?.hasOwnProperty(key)) {
                dealLogMessage.push(`'${key}' of Contact changed from '${oldContact[key as keyof UpdateAccountDto]}' to '${contactDto[key as keyof UpdateAccountDto]}'`)
            }
        })

        return {
            contact
        }
    }

    public async createOrUpdateLinkedInContact(
        { user, linkedinProfileLink, linkedinProfileId, industryId, contactData, twitter }:
            { user: Users, linkedinProfileLink: string, linkedinProfileId: string, industryId: string, contactData: IContact, twitter?: string }
    ): Promise<{ contact: Contacts, reference: LinkedinReferences, message: string, isAlreadyExist: boolean }> {
        try {
            let contact = await Contacts.findOne({
                where: {
                    workspaceId: user.companyId,
                    linkedinProfileLink
                }
            });


            let socialMediaLinks = contact?.socialMediaLinks || [];
            const twitterLink = { name: 'Twitter', url: twitter };
            const existingTwitterIndex = socialMediaLinks.findIndex(link => link.name === 'Twitter');
            if (twitter) {
                if (existingTwitterIndex > -1) {
                    socialMediaLinks[existingTwitterIndex].url = twitter;
                } else {
                    socialMediaLinks.push(twitterLink);
                }
            }
            contactData.socialMediaLinks = socialMediaLinks;

            if (contact) {
                contact = await contact.update({ ...contactData });

                let reference = await this.linkedinReferenceService.getReferenceByContactIdProfileId(contact.id, linkedinProfileId,);
                if (reference) await this.linkedinReferenceService.updateReference(contact.id, linkedinProfileId, contactData.linkedinConnectedDate, contactData.linkedinConnected);
                else {
                    reference = await this.linkedinReferenceService.createReference(contact.id, linkedinProfileId, user.id, industryId, contactData.linkedinConnectedDate, contactData.linkedinConnected);
                }

                return {
                    message: contactsMessages.contactFound,
                    isAlreadyExist: true,
                    contact,
                    reference,
                };
            }

            // Create new contact if not found
            contact = await Contacts.create({
                ...contactData,
                linkedinProfileLink,
                workspaceId: user.companyId,
                source: SOURCE.LINKEDIN
            });

            const reference = await this.linkedinReferenceService.createReference(contact.id, linkedinProfileId, user.id, industryId, contactData.linkedinConnectedDate, contactData.linkedinConnected);

            return {
                message: contactsMessages.contactCreated,
                isAlreadyExist: false,
                contact,
                reference,
            };
        } catch (error) {
            console.error(contactsMessages.contactCreatedError, error);
            throw new InternalServerErrorException(error);
        }
    }

    public async getAllContacts(
        {
            user, search, upworkProfile, linkedinProfile, bidder, linkedInType, source, industries, dates, page = 1, perPage = '20'
        }: {
            user: Users,
            search: string,
            upworkProfile: string[],
            linkedinProfile: string[],
            bidder: string[],
            industries: string[],
            source: SOURCE,
            linkedInType: LINKEDIN_CONNECTION_TYPE,
            dates: DateProps,
            page: number,
            perPage: string,
        }
    ) {
        try {
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
                        require: true, // This will help you. But you will see nwe error
                        rejectUnauthorized: false // This line will fix new error
                    }
                } : {},
            });

            const query = `
            WITH FilteredContacts AS (
                SELECT
                    c.id,
                    c.name,
                    c.source,
                    c.slug,
                    c."createdAt",
                    COALESCE(json_agg(
                        json_build_object(
                            'id', b.id,
                            'user', json_build_object(
                                'name', u.name,
                                'deletedAt', u."deletedAt"
                            ),
                            'bidProfile', json_build_object(
                                'name', p.name,
                                'deletedAt', p."deletedAt"
                            )
                        )
                    ) FILTER (WHERE b.id IS NOT NULL), '[]') AS bid,
					COALESCE(json_agg(
                        json_build_object(
                            'id', lr.id,
                            'linkedinConnected', lr."linkedinConnected",
                            'linkedinConnectedDate', lr."linkedinConnectedDate",
                            'createdAt', lr."createdAt",
                            'user', json_build_object(
                                'name', lu.name,
                                'deletedAt', lu."deletedAt"
                            ),
                            'profile', json_build_object(
                                'name', lp.name,
                                'deletedAt', lp."deletedAt"
                            ),
                            'industry', json_build_object(
                                'name', ind.name
                            )
                        )
                    ) FILTER (WHERE lr.id IS NOT NULL), '[]') AS "linkedInReference",
                    MAX(lr."createdAt") AS "latestLinkedInReferenceCreatedAt"
                FROM
                    "contacts" c
                LEFT JOIN "bids" b ON b."contactId" = c.id
                LEFT JOIN "users" u ON u.id = b."userId"
                LEFT JOIN "profiles" p ON p.id = b."bidProfileId"
                LEFT JOIN "linkedin-references" lr ON lr."contactId" = c.id
                LEFT JOIN "users" lu ON lu.id = lr."userId"
                LEFT JOIN "profiles" lp ON lp.id = lr."linkedinProfileId"
                LEFT JOIN "industries" ind ON ind.id = lr."industryId"
                WHERE
                    c."workspaceId" = :workplaceId
                    -- Source Filter
                    AND (:source IS NULL OR c.source = :source)
                    -- Date Filter
                    AND (
                        (:startDate IS NULL OR :endDate IS NULL OR 
                        (c."createdAt" BETWEEN :startDate AND :endDate OR lr."createdAt" BETWEEN :startDate AND :endDate))
                    )
                    
                    -- Search Filter
                    AND (
                        :search IS NULL OR
                        c.name ILIKE '%' || :search || '%' OR
                        c.email ILIKE '%' || :search || '%' OR
                        c.location ILIKE '%' || :search || '%' OR
                        c."locationCountry" ILIKE '%' || :search || '%' OR
                        c."locationState" ILIKE '%' || :search || '%' OR
                        c.address ILIKE '%' || :search || '%' OR
                        c."phoneNumber" ILIKE '%' || :search || '%' OR
                        c."profileHeadline" ILIKE '%' || :search || '%'
                    )
                    -- Upwork Profile and Bidder Filters
                   ${upworkProfile?.length ? ' AND b."bidProfileId" in (:upworkProfile) ' : ''}
                   ${bidder?.length ? ' AND ( b."userId" in (:bidder) OR lr."userId" in (:bidder) ) ' : ''}
                    -- LinkedIn Profile and LinkedIn Type Filters
                    ${linkedinProfile?.length ? ' AND lr."linkedinProfileId" in (:linkedinProfile) ' : ''}                    
                    ${industries?.length ? ' AND lr."industryId" in (:industries) ' : ''}                    
                    AND (
                        :linkedInType IS NULL OR lr."linkedinConnected" = 
                        CASE 
                            WHEN :linkedInType = '${LINKEDIN_CONNECTION_TYPE.PROSPECT}' THEN true 
                            ELSE false 
                        END
                    )
                GROUP BY c.id
                ORDER BY 
                    CASE 
                        WHEN c.source = '${SOURCE.LINKEDIN}' THEN MAX(lr."createdAt")
                        ELSE c."createdAt" 
                    END DESC NULLS LAST
                LIMIT :limit
                OFFSET :offset
            )
            
            SELECT * FROM FilteredContacts;
                    
            `;

            const countQuery = `
            SELECT COUNT(DISTINCT c.id) AS "contactsCount"
            FROM "contacts" c
            LEFT JOIN "bids" b ON b."contactId" = c.id
            LEFT JOIN "linkedin-references" lr ON lr."contactId" = c.id
            LEFT JOIN "users" u ON u.id = b."userId"
            LEFT JOIN "profiles" p ON p.id = b."bidProfileId"
            LEFT JOIN "industries" ind ON ind.id = lr."industryId"
            WHERE
                c."workspaceId" = :workplaceId
                AND (:source IS NULL OR c.source = :source)
                AND (:startDate IS NULL OR :endDate IS NULL OR c."createdAt" BETWEEN :startDate AND :endDate)
                AND (
                    :search IS NULL OR
                    c.name ILIKE '%' || :search || '%' OR
                    c.email ILIKE '%' || :search || '%' OR
                    c.location ILIKE '%' || :search || '%' OR
                    c."locationCountry" ILIKE '%' || :search || '%' OR
                    c."locationState" ILIKE '%' || :search || '%' OR
                    c.address ILIKE '%' || :search || '%' OR
                    c."phoneNumber" ILIKE '%' || :search || '%' OR
                    c."profileHeadline" ILIKE '%' || :search || '%'
                )
                ${upworkProfile?.length ? ' AND b."bidProfileId" in (:upworkProfile) ' : ''}
                ${bidder?.length ? ' AND ( b."userId" in (:bidder) OR lr."userId" in (:bidder) ) ' : ''}
                ${linkedinProfile?.length ? ' AND lr."linkedinProfileId" in (:linkedinProfile) ' : ''}
                ${industries?.length ? ' AND lr."industryId" in (:industries) ' : ''}                    
                AND (
                    :linkedInType IS NULL OR lr."linkedinConnected" = 
                    CASE 
                        WHEN :linkedInType = '${LINKEDIN_CONNECTION_TYPE.PROSPECT}' THEN true 
                        ELSE false 
                    END
                )
        `;

            const result = await sequelize.query(query, {
                replacements: {
                    workplaceId: user.companyId,
                    search: search || null,
                    upworkProfile: upworkProfile?.length ? upworkProfile : null,
                    linkedinProfile: linkedinProfile?.length ? linkedinProfile : null,
                    bidder: bidder?.length ? bidder : null,
                    industries: industries?.length ? industries : null,
                    source: source || null,
                    linkedInType: linkedInType || null,
                    startDate: dates?.startDate || null,
                    endDate: dates?.endDate || null,
                    limit: +perPage,
                    offset: (page - 1) * +perPage
                    ,
                },
            });

            const countResult: any = await sequelize.query(countQuery, {
                replacements: {
                    workplaceId: user.companyId,
                    search: search || null,
                    upworkProfile: upworkProfile?.length ? upworkProfile : null,
                    linkedinProfile: linkedinProfile?.length ? linkedinProfile : null,
                    bidder: bidder?.length ? bidder : null,
                    industries: industries?.length ? industries : null,
                    source: source || null,
                    linkedInType: linkedInType || null,
                    startDate: dates?.startDate || null,
                    endDate: dates?.endDate || null,
                },
            });

            const contactsCount = countResult[0][0]?.contactsCount || 0;

            // Calculate total pages
            const totalPages = Math.ceil(contactsCount / +perPage);

            return {
                message: contactsMessages.allContactsFetched,
                page,
                contacts: result[0],
                contactsPerPage: +perPage,
                contactsCount,
                totalPages,
            };
        } catch (err) {
            console.error(contactsMessages.allContactsFetchedError, err);
            throw new InternalServerErrorException(contactsMessages.allContactsFetchedError);
        }
    }

    public async getContactBySlug(workspaceId: string, slug: string): Promise<{ message: string, contact: Contacts }> {
        try {
            const contactExist = await Contacts.findOne({ where: { slug, workspaceId } })
            if (!contactExist) throw new NotFoundException(contactsMessages.contactNotFound)

            const contact = await Contacts.findOne({
                where: {
                    id: contactExist.id,
                    workspaceId,
                },
                include: [
                    {
                        model: Companies,
                        attributes: ['name', 'location'],
                        include: [{
                            model: ContactExperience,
                            attributes: ['duration', 'totalDuration', 'title'],
                            where: {
                                contactId: contactExist.id
                            }
                        }],
                        through: {
                            attributes: [],
                        }
                    },
                    {
                        model: Institutions,
                        attributes: ['name'],
                        include: [{
                            model: ContactEducation,
                            attributes: ['duration', 'degree'],
                            where: {
                                contactId: contactExist.id
                            }
                        }],
                        through: {
                            attributes: [],
                        }
                    },
                    {
                        model: Skills,
                        attributes: ['name'],
                        include: [{
                            model: ContactSkills,
                            attributes: [],
                            where: {
                                contactId: contactExist.id
                            }
                        }],
                        through: {
                            attributes: [],
                        }
                    },
                    {
                        model: Jobs,
                        attributes: ['title', 'category', 'url', 'postedDate']
                    },
                    {
                        model: Bids,
                        attributes: ['id', 'slug', 'upworkProposalURL', 'status', 'createdAt', 'responseDate', 'contractDate'],
                        include: [
                            {
                                model: Users,
                                attributes: ['name', 'deletedAt'],
                                paranoid: false
                            },
                            {
                                model: Profiles,
                                attributes: ['name', 'deletedAt'],
                                paranoid: false
                            },
                        ]
                    },
                    {
                        model: LinkedinReferences,
                        attributes: ['id'],
                        include: [
                            {
                                model: Users,
                                attributes: ['name', 'deletedAt'],
                                paranoid: false
                            },
                            {
                                model: Profiles,
                                attributes: ['name', 'deletedAt'],
                                paranoid: false
                            },
                            {
                                model: Industries,
                                attributes: ['name']
                            }
                        ]
                    }
                ]
            });


            return {
                message: contactsMessages.contactByIdFetched,
                contact,
            };
        } catch (err) {
            console.error(contactsMessages.contactByIdFetchedError, err);
            if (err instanceof HttpException) throw err
            else throw new InternalServerErrorException(contactsMessages.contactByIdFetchedError);
        }
    }

    public async getExcelContacts(
        {
            user, search, upworkProfile, linkedinProfile, bidder, linkedInType, source, industries, dates
        }: {
            user: Users,
            search: string,
            upworkProfile: string[],
            linkedinProfile: string[],
            bidder: string[],
            industries: string[],
            source: SOURCE,
            linkedInType: LINKEDIN_CONNECTION_TYPE,
            dates: DateProps,
        }
    ) {

        try {
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
                        require: true, // This will help you. But you will see nwe error
                        rejectUnauthorized: false // This line will fix new error
                    }
                } : {},
            });

            const query = `
            WITH ExperienceData AS (
	SELECT EXP
		."contactId",
		json_agg ( json_build_object ( 'duration', EXP.duration, 'totalDuration', EXP."totalDuration", 'title', EXP.title ) ) AS experiences 
	FROM
		"contact-experience" EXP 
	GROUP BY
		EXP."contactId" 
	),
	EducationData AS (
	SELECT
		edu."contactId",
		json_agg ( json_build_object ( 'duration', edu.duration, 'degree', edu.DEGREE ) ) AS education 
	FROM
		"contact-education" edu 
	GROUP BY
		edu."contactId" 
	),
	FilteredContacts AS (
	SELECT
		C.*,
		json_build_object (
			'title', COALESCE(j.title, ''),
			'url', COALESCE(j.url, '')
			) as job,
		COALESCE (
			json_agg (DISTINCT jsonb_build_object ( 
			'id', b.ID, 
			'user', json_build_object ( 'name', u.NAME ), 
			'bidProfile', json_build_object ( 'name', P.NAME ),
			'upworkProposalURL', b."upworkProposalURL",
			'slug', b.slug
			) ) FILTER ( WHERE b.ID IS NOT NULL ),
			'[]' 
		) AS bid,
		COALESCE (
			json_agg (
				DISTINCT jsonb_build_object (
					'id',
					lr.ID,
					'linkedinConnected',
					lr."linkedinConnected",
					'linkedinConnectedDate',
					lr."linkedinConnectedDate",
					'createdAt',
					lr."createdAt",
					'user',
					json_build_object ( 'name', lu.NAME ),
					'profile',
					json_build_object ( 'name', lp.NAME ),
					'industry',
					json_build_object ( 'name', ind.NAME ) 
				) 
			) FILTER ( WHERE lr.ID IS NOT NULL ),
			'[]' 
		) AS "linkedInReference",
		MAX ( lr."createdAt" ) AS "latestLinkedInReferenceCreatedAt",
		COALESCE (
			json_agg (
				DISTINCT jsonb_build_object (
					'name',
					co.NAME,
					'location',
					co.LOCATION,
					'experience',
					COALESCE ( ( SELECT experiences FROM ExperienceData WHERE "contactId" = C.ID ), '[]' ) 
				) 
			) FILTER ( WHERE co.ID IS NOT NULL ),
			'[]' 
		) AS companies,
		COALESCE (
			(
			SELECT
				json_agg ( json_build_object ( 'name', s.NAME ) ) 
			FROM
				"contact-skills" cs
				JOIN "skills" s ON cs."skillId" = s.ID 
			WHERE
				cs."contactId" = C.ID 
			),
			'[]' 
		) AS skills,
		COALESCE ( 
			json_agg (DISTINCT jsonb_build_object (
				'name', i.name,
				'education', ( SELECT education FROM EducationData WHERE "contactId" = C.ID )
				)
			),
		 '[]' )  AS institutions 
	FROM
		"contacts" C
		LEFT JOIN "jobs" j ON j."id" = C."jobId"  
		LEFT JOIN "bids" b ON b."contactId" = C.ID 
		LEFT JOIN "users" u ON u.ID = b."userId"
		LEFT JOIN "profiles" P ON P.ID = b."bidProfileId"
		LEFT JOIN "linkedin-references" lr ON lr."contactId" = C.ID 
		LEFT JOIN "users" lu ON lu.ID = lr."userId"
		LEFT JOIN "profiles" lp ON lp.ID = lr."linkedinProfileId"
		LEFT JOIN "industries" ind ON ind.ID = lr."industryId"
		LEFT JOIN "contact-experience" EXP ON EXP."contactId" = C.ID 
		LEFT JOIN "company" co ON co.ID = EXP."companyId"
		LEFT JOIN "contact-education" ed ON ed."contactId" = C.ID 
		LEFT JOIN "institutions" i ON i.ID = ed."institutionId" 
    WHERE
        c."workspaceId" = :workplaceId
        AND (:source IS NULL OR c.source = :source)
        AND (
            (:startDate IS NULL OR :endDate IS NULL OR 
            (c."createdAt" BETWEEN :startDate AND :endDate OR lr."createdAt" BETWEEN :startDate AND :endDate))
        )
        AND (
            :search IS NULL OR
            c.name ILIKE '%' || :search || '%' OR
            c.email ILIKE '%' || :search || '%' OR
            c.location ILIKE '%' || :search || '%' OR
            c."locationCountry" ILIKE '%' || :search || '%' OR
            c."locationState" ILIKE '%' || :search || '%' OR
            c.address ILIKE '%' || :search || '%' OR
            c."phoneNumber" ILIKE '%' || :search || '%' OR
            c."profileHeadline" ILIKE '%' || :search || '%'
        )
        ${upworkProfile?.length ? ' AND b."bidProfileId" in (:upworkProfile) ' : ''}
        ${bidder?.length ? ' AND ( b."userId" in (:bidder) OR lr."userId" in (:bidder) ) ' : ''}
        ${linkedinProfile?.length ? ' AND lr."linkedinProfileId" in (:linkedinProfile) ' : ''}                    
        ${industries?.length ? ' AND lr."industryId" in (:industries) ' : ''}                    
        AND (
            :linkedInType IS NULL OR lr."linkedinConnected" = 
            CASE 
                WHEN :linkedInType = '${LINKEDIN_CONNECTION_TYPE.PROSPECT}' THEN true 
                ELSE false 
            END
        )
    GROUP BY c.id, j.id, lr.id
    ORDER BY 
        CASE 
            WHEN c.source = '${SOURCE.LINKEDIN}' THEN MAX(lr."createdAt")
            ELSE c."createdAt" 
        END DESC NULLS LAST
)

SELECT * FROM FilteredContacts fc;
`

            const countQuery = `
            SELECT COUNT(DISTINCT c.id) AS "contactsCount"
            FROM "contacts" c
            LEFT JOIN "bids" b ON b."contactId" = c.id
            LEFT JOIN "linkedin-references" lr ON lr."contactId" = c.id
            LEFT JOIN "users" u ON u.id = b."userId"
            LEFT JOIN "profiles" p ON p.id = b."bidProfileId"
            LEFT JOIN "industries" ind ON ind.id = lr."industryId"
            WHERE
                c."workspaceId" = :workplaceId
                AND (:source IS NULL OR c.source = :source)
                AND (:startDate IS NULL OR :endDate IS NULL OR c."createdAt" BETWEEN :startDate AND :endDate)
                AND (
                    :search IS NULL OR
                    c.name ILIKE '%' || :search || '%' OR
                    c.email ILIKE '%' || :search || '%' OR
                    c.location ILIKE '%' || :search || '%' OR
                    c."locationCountry" ILIKE '%' || :search || '%' OR
                    c."locationState" ILIKE '%' || :search || '%' OR
                    c.address ILIKE '%' || :search || '%' OR
                    c."phoneNumber" ILIKE '%' || :search || '%' OR
                    c."profileHeadline" ILIKE '%' || :search || '%'
                )
                ${upworkProfile?.length ? ' AND b."bidProfileId" in (:upworkProfile) ' : ''}
                ${bidder?.length ? ' AND ( b."userId" in (:bidder) OR lr."userId" in (:bidder) ) ' : ''}
                ${linkedinProfile?.length ? ' AND lr."linkedinProfileId" in (:linkedinProfile) ' : ''}
                ${industries?.length ? ' AND lr."industryId" in (:industries) ' : ''}                    
                AND (
                    :linkedInType IS NULL OR lr."linkedinConnected" = 
                    CASE 
                        WHEN :linkedInType = '${LINKEDIN_CONNECTION_TYPE.PROSPECT}' THEN true 
                        ELSE false 
                    END
                )
        `;

            const result = await sequelize.query(query, {
                replacements: {
                    workplaceId: user.companyId,
                    search: search || null,
                    upworkProfile: upworkProfile?.length ? upworkProfile : null,
                    linkedinProfile: linkedinProfile?.length ? linkedinProfile : null,
                    bidder: bidder?.length ? bidder : null,
                    industries: industries?.length ? industries : null,
                    source: source || null,
                    linkedInType: linkedInType || null,
                    startDate: dates?.startDate || null,
                    endDate: dates?.endDate || null,
                },
            });

            const countResult: any = await sequelize.query(countQuery, {
                replacements: {
                    workplaceId: user.companyId,
                    search: search || null,
                    upworkProfile: upworkProfile?.length ? upworkProfile : null,
                    linkedinProfile: linkedinProfile?.length ? linkedinProfile : null,
                    bidder: bidder?.length ? bidder : null,
                    industries: industries?.length ? industries : null,
                    source: source || null,
                    linkedInType: linkedInType || null,
                    startDate: dates?.startDate || null,
                    endDate: dates?.endDate || null,
                },
            });

            const contactsCount = countResult[0][0]?.contactsCount || 0;

            return {
                message: contactsMessages.allContactsFetched,
                contacts: result[0],
                contactsCount,
            };
        } catch (err) {
            console.error(contactsMessages.contactExcelError, err);
            throw new InternalServerErrorException(contactsMessages.contactExcelError);
        }
    }

    async getUserIds(user: Users, bidderId?: string) {
        if (user.role === ROLES.BIDDER) {
            return [user.id]
        } else if (user.role === ROLES.COMPANY_ADMIN || user.role === ROLES.OWNER) {
            if (bidderId) {
                return [bidderId];
            }
            const users = await Users.findAll({
                where: {
                    companyId: user.companyId,
                    role: {
                        [Op.in]: [ROLES.BIDDER, ROLES.COMPANY_ADMIN, ROLES.OWNER]
                    }
                },
                attributes: ['id'],
                paranoid: false,
            });
            return users?.map((user: Users) => user.id)
        } else return []
    }

    async countLinkedInConnections(
        userId: string,
        monthStart: string,
        dayStart: string,
        dayEnd: string
    ): Promise<{ thisMonthConnections: number, thisDayConnections: number, thisMonthProspects: number, thisDayProspects: number }> {
        const thisMonthConnections = await LinkedinReferences.count({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: monthStart ?? moment().startOf("month").toDate(),
                },
            },
        });

        const thisMonthProspects = await LinkedinReferences.count({
            where: {
                userId,
                linkedinConnected: true,
                createdAt: {
                    [Op.gte]: monthStart ?? moment().startOf("month").toDate(),
                },
            },
        });

        const thisDayConnections = await LinkedinReferences.count({
            where: {
                userId,
                createdAt: {
                    [Op.gte]: dayStart ?? moment().startOf("day").toDate(),
                    [Op.lte]: dayEnd ?? moment().endOf("day").toDate(),
                },
            },
        });

        const thisDayProspects = await LinkedinReferences.count({
            where: {
                userId,
                linkedinConnected: true,
                createdAt: {
                    [Op.gte]: dayStart ?? moment().startOf("day").toDate(),
                    [Op.lte]: dayEnd ?? moment().endOf("day").toDate(),
                },
            },
        });
        return { thisMonthConnections, thisDayConnections, thisMonthProspects, thisDayProspects };
    }

    async mapLocationToCountryAndState() {
        const contactsPerPage = 100;
        const totalPages = 70;
        try {

            for (let page = 1; page <= totalPages; page++) {
                const offset = (page - 1) * contactsPerPage;
                const options: any = {
                    offset,
                    limit: contactsPerPage,
                    where: {
                        source: SOURCE.LINKEDIN,
                        locationCountry: ''
                    },
                };

                const contacts = await Contacts.findAll(options);
                for (let contact of contacts) {
                    if (contact.locationCountry !== countryNames[contact.locationCountry]) {
                        const apiKey = process.env.OPEN_CAGE_API_KEY;
                        const url = `https://api.opencagedata.com/geocode/v1/json?q=${contact.location}&key=${apiKey}&language=en`;
                        const response = await fetch(url);
                        const data = await response.json();
                        if (data.results.length > 0) {
                            const components = data.results[0].components;
                            const locationState = components.state;
                            const locationCountry = components.country;
                            contact.locationCountry = locationCountry;
                            contact.locationState = locationState;
                            console.log('-------->> Location: ', contact.location, ' ---> ', locationCountry, locationState);
                            await contact.save();
                        }
                    }
                }

                console.log(`Processed contacts for page ${page}`);
            }
        } catch (error) {
            console.error("Error processing contacts:", error);
        }
    }

    public async createContactFromUpworkAPI( workspaceId: string, jobId: string, { clientCompanyPublic }: IMarketplaceJobPosting): Promise<{ contact: Contacts, message: string, isAlreadyExist: boolean }> {
        try {
            let contact = await Contacts.findOne({
                where: {
                    workspaceId,
                    jobId
                }
            })

            if (contact) {
                return {
                    message: contactsMessages.contactFound,
                    isAlreadyExist: true,
                    contact,
                }
            }

            contact = await Contacts.create({ 
                jobId, 
                workspaceId, 
                source: SOURCE.UPWORK, 
                locationCountry: clientCompanyPublic?.country?.name, 
                locationState: clientCompanyPublic?.city,
                timeZone: clientCompanyPublic?.timezone
            })

            // await this.dealLogsService.createAccountLog({
            //     userId,
            //     contactId: contact.id,
            //     contactLogType: ACCOUNT_LOG_TYPE.ACCOUNT_CREATED,
            //     message: `Contact Created Manually.`,
            // } as CreateAccountLogDto);


            return {
                message: contactsMessages.contactCreated,
                isAlreadyExist: false,
                contact,
            }
        } catch (error) {
            console.error(contactsMessages.contactCreatedError, error)
            throw new InternalServerErrorException(error)
        }
    }

}



