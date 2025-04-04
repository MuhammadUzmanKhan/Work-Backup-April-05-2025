import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { JobService } from "../jobs/jobs.service";
import { Bids } from "src/common/models/bids.model";
import { Users } from "src/common/models/users.model";
import { ConfigService } from "@nestjs/config";
import { Sequelize } from "sequelize";
import pg from "pg";
import { Jobs } from "src/common/models/jobs.model";
import { JobsTags } from "src/common/models/jobs-tags.model";
import { Tags } from "src/common/models/tags.model";
import { Profiles } from "src/common/models/profiles.model";
import {
  BID_FILTER_TYPES,
  BID_TYPES,
  DEAL_LOG_TYPE,
} from "src/common/constants/bids";
import { BidStatus } from "src/types/enum";
import { ROLES } from "src/common/constants/roles";
import { Op } from "sequelize";
import * as moment from "moment-timezone";
import { SOURCE } from "src/common/constants/source";
import { Contacts } from "src/common/models/contacts.model";
import { bidsMessages } from "src/common/constants/messages";
import { RollbarHandler } from "nestjs-rollbar";
import { SearchParams } from "src/types/bids";

export interface DateProps {
  startDate?: string;
  endDate?: string;
  creationEndDate?: string;
  leadStartDate?: string;
  leadEndDate?: string;
  proposalStartDate?: string;
  proposalEndDate?: string;
  contractStartDate?: string;
  contractEndDate?: string;
}

@Injectable()
export class BidJobAccountService {
  constructor(
    private readonly jobService: JobService,
    private readonly configService: ConfigService
  ) { }

  @RollbarHandler({ rethrow: true })
  public async getBiddersBidOrAdminBids(
    searchParams: SearchParams
  ) {
    const {
      user,
      search,
      profile,
      page,
      bidderId,
      status,
      dates,
      perPage,
      slug,
      hourlyRange,
      proposedRate,
      receivedRate,
      location,
      skillSet,
      type
    } = searchParams
    const bidsPerPage = +perPage;
    const offset = (page - 1) * bidsPerPage;

    const { userIds } = await this.getUserIds(user, true, bidderId);

    const jobInclude: any = {
      model: Jobs,
      where: {
        [Op.and]: [],
        [Op.or]: []
      },
      required: true,
    };

    // Initialize base query
    let whereQuery: any = {
      userId: userIds,
      ...(profile && { bidProfileId: profile }),
      [Op.and]: [],
      [Op.or]: [],
    };

    const createRateCondition = (column: any, value: any) => ({
      [Op.and]: Sequelize.where(
        Sequelize.cast(
          Sequelize.fn(
            'NULLIF',
            Sequelize.fn(
              'REGEXP_REPLACE',
              Sequelize.fn('COALESCE', Sequelize.col(column), ''),
              '[^0-9.]',
              '',
              'g'
            ),
            ''
          ),
          'DECIMAL'
        ),
        value
      ),
    });

    if (proposedRate) whereQuery[Op.and].push(createRateCondition('proposedRate', +proposedRate));
    if (receivedRate) whereQuery[Op.and].push(createRateCondition('receivedAmount', +receivedRate));


    if (hourlyRange && hourlyRange.filter(Boolean).length === 2) {
      const [minRange, maxRange] = hourlyRange.map((value) =>
        parseFloat(value.toString().replace(/[^0-9.-]/g, '')) // Remove non-numeric characters
      );

      jobInclude.where[Op.and].push(
        // Check for the minimum part of the range
        Sequelize.where(
          Sequelize.fn(
            'COALESCE',
            Sequelize.cast(
              Sequelize.fn(
                'NULLIF',
                Sequelize.fn(
                  'SPLIT_PART',
                  Sequelize.fn(
                    'REGEXP_REPLACE',
                    Sequelize.fn('COALESCE', Sequelize.col('hourlyRange'), ''),
                    '[^0-9.-]', // Remove all non-numeric characters except digits, dots, and hyphens
                    '',
                    'g'
                  ),
                  '-', // Split on hyphen
                  1 // Get the first part (lower bound)
                ),
                ''
              ),
              'DECIMAL'
            ),
            0 // Default to 0 if NULL
          ),
          { [Op.gte]: minRange } // Ensure value is >= minRange
        ),
        // Check for the maximum part of the range
        Sequelize.where(
          Sequelize.fn(
            'COALESCE',
            Sequelize.cast(
              Sequelize.fn(
                'NULLIF',
                Sequelize.literal(`
                  CASE
                    WHEN array_length(string_to_array(
                      REGEXP_REPLACE(COALESCE("hourlyRange", ''), '[^0-9.-]', '', 'g'),
                      '-'
                    ), 1) = 2
                    THEN split_part(
                      REGEXP_REPLACE(COALESCE("hourlyRange", ''), '[^0-9.-]', '', 'g'),
                      '-', 
                      2
                    )
                    ELSE split_part(
                      REGEXP_REPLACE(COALESCE("hourlyRange", ''), '[^0-9.-]', '', 'g'),
                      '-', 
                      1
                    )
                  END
                `),
                'DECIMAL'
              ),
              'DECIMAL'
            )
          ),
          { [Op.lte]: maxRange } // Ensure value is <= maxRange
        )
      );
    }

    if (status.length && !status.includes(BID_TYPES.ALL)) {
      whereQuery.status = [];
      status.forEach((bidType) => {
        if (bidType === BID_TYPES.PROPOSALS) whereQuery.status.push(BidStatus.PENDING);
        if (bidType === BID_TYPES.LEADS) whereQuery.status.push(BidStatus.ACTIVE);
        if (bidType === BID_TYPES.CONTRACTS) whereQuery.status.push(BidStatus.COMPLETED);
      });
    }

    // In Jobs Searching
    if (search && skillSet && skillSet.length) {

      let requiredJobIds: string[] = [];
      // If both filters are applied, fetch job IDs for both and find the intersection
      const { jobIds: searchJobIds } = await this.jobService.getJobIds(search);
      const { jobIds: skillSetJobIds } = await this.jobService.getJobIdsByTags(skillSet);

      // Find the intersection of job IDs from both filters
      requiredJobIds = searchJobIds.filter((id) => skillSetJobIds.includes(id));

      // Apply the `whereQuery` with the intersected job IDs
      whereQuery[Op.or].push({
        jobId: requiredJobIds,
      },
      )
    } else if (search) {
      // If only `search` filter is applied
      const { jobIds } = await this.jobService.getJobIds(search);
      whereQuery[Op.or].push({
        jobId: jobIds,
      })
    } else if (skillSet && skillSet.length) {
      // If only `skillSet` filter is applied
      const { jobIds } = await this.jobService.getJobIdsByTags(skillSet);
      whereQuery[Op.or].push({
        jobId: jobIds,
      },)
    }

    // In Bids Searching
    if (search) {
      whereQuery[Op.or].push(...[
        {
          upworkProposalURL: search
        },
        {
          slug: search
        },
      ])
    }

    // Apply date filters for Proposal, Lead, and Contract Dates
    if (dates) {
      if ((dates.startDate && dates.endDate) && status.includes(BID_TYPES.ALL)) {
        whereQuery.createdAt = {
          [Op.between]: [dates.startDate, dates.endDate],
        };
      }
      if (dates.proposalStartDate && dates.proposalEndDate) {
        whereQuery.createdAt = {
          [Op.between]: [dates.proposalStartDate, dates.proposalEndDate],
        };
      }
      if (dates.leadStartDate && dates.leadEndDate) {
        whereQuery.responseDate = {
          [Op.between]: [dates.leadStartDate, dates.leadEndDate],
        };
      }
      if (dates.contractStartDate && dates.contractEndDate) {
        whereQuery.contractDate = {
          [Op.between]: [dates.contractStartDate, dates.contractEndDate],
        };
      }
    }

    if (type && type.length) {

      if (type.includes(BID_FILTER_TYPES.REGULAR)) {
        whereQuery[Op.or].push({
          isManual: false,
          invite: false,
        });
      }

      if (type.includes(BID_FILTER_TYPES.DIRECT)) {
        whereQuery[Op.or].push({
          isManual: true,
          invite: false,
        });
      }

      if (type.includes(BID_FILTER_TYPES.INVITES)) {
        whereQuery[Op.or].push({
          invite: true,
        });
      }

      if (type.includes(BID_FILTER_TYPES.INVITE_ONLY)) {
        jobInclude.where[Op.or].push({
          inviteOnly: true,
        });
      }

      if (type.includes(BID_FILTER_TYPES.BOOSTED)) {
        whereQuery[Op.or].push({
          boosted: true,
        });
      }
    }

    whereQuery[Op.or].length === 0 ? delete whereQuery[Op.or] : null;
    whereQuery[Op.and].length === 0 ? delete whereQuery[Op.and] : null;
    jobInclude.where[Op.or].length === 0 ? delete jobInclude.where[Op.or] : null;
    jobInclude.where[Op.and].length === 0 ? delete jobInclude.where[Op.and] : null;

    // Calculate counts for Proposals, Leads, and Contracts

    const allBidsCount = await Bids.count({
      where: {
        ...whereQuery,
        ...(dates.startDate &&
          dates.endDate && {
          createdAt: {
            [Op.between]: [dates.startDate, dates.endDate],
          },
        }),
      },
      include: [
        {
          model: Contacts,
          ...(location.length && {
            where: {
              locationCountry: location
            },
          }),
        },
        jobInclude
      ],
    });

    const proposalsCount = await Bids.count({
      where: {
        ...whereQuery,
        status: BidStatus.PENDING,
        ...((((dates.startDate && dates.endDate) || (dates.proposalStartDate && dates.proposalEndDate)) && status.includes(BID_TYPES.PROPOSALS)) && {
          [Op.or]: [
            {
              createdAt: {
                [Op.between]: [dates.proposalStartDate, dates.proposalEndDate],
              },
            },
            {
              createdAt: {
                [Op.between]: [dates.startDate, dates.endDate],
              },
            },
          ],
        }),
      },
      include: [
        {
          model: Contacts,
          ...(location.length && {
            where: {
              locationCountry: location
            },
          }),
        },
        jobInclude
      ],
    });

    const leadsCount = await Bids.count({
      where: {
        ...whereQuery,
        status: BidStatus.ACTIVE,
        ...((((dates.startDate && dates.endDate) || (dates.leadStartDate && dates.leadEndDate)) && status.includes(BID_TYPES.LEADS)) && {
          [Op.or]: [
            {
              responseDate: {
                [Op.between]: [dates.leadStartDate, dates.leadEndDate],
              },
            },
            {
              responseDate: {
                [Op.between]: [dates.startDate, dates.endDate],
              },
            }
          ],
        }),
      },
      include: [
        {
          model: Contacts,
          ...(location.length && {
            where: {
              locationCountry: location
            },
          }),
        },
        jobInclude
      ],
    });

    const contractsCount = await Bids.count({
      where: {
        ...whereQuery,
        status: BidStatus.COMPLETED,
        ...((((dates.startDate && dates.endDate) || (dates.contractStartDate && dates.contractEndDate)) && status.includes(BID_TYPES.CONTRACTS)) && {
          [Op.or]: [
            {
              contractDate: {
                [Op.between]: [dates.contractStartDate, dates.contractEndDate],
              },
            },
            {
              contractDate: {
                [Op.between]: [dates.startDate, dates.endDate],
              },
            }
          ],
        }),
      },
      include: [
        {
          model: Contacts,
          ...(location.length && {
            where: {
              locationCountry: location
            },
          }),
        },
        jobInclude,
      ],
    });

    let bidsCount = 0;
    // Set the count based on the current type
    if (status.includes(BID_TYPES.PROPOSALS)) {
      bidsCount += proposalsCount;
    }
    if (status.includes(BID_TYPES.LEADS)) {
      bidsCount += leadsCount;
    }
    if (status.includes(BID_TYPES.CONTRACTS)) {
      bidsCount += contractsCount;
    }
    if (status.includes(BID_TYPES.ALL)) {
      bidsCount = allBidsCount;
    }

    const totalPages = Math.ceil(bidsCount / bidsPerPage);

    if (slug) {
      const bidFound = await Bids.findOne({
        where: {
          slug: slug,
          userId: userIds,
        },
      });
      if (!bidFound) throw new NotFoundException(bidsMessages.dealNotFound);

      whereQuery = {
        ...whereQuery,
        slug: slug,
      };
    }

    let result: any[] = [];

    let order: any = [["createdAt", "DESC"]];
    if (status.includes(BID_TYPES.LEADS)) order = [["responseDate", "DESC"], ['createdAt', "DESC"]];
    if (status.includes(BID_TYPES.CONTRACTS)) order = [["contractDate", "DESC"], ["responseDate", "DESC"]];
    // Fetch bids based on type
    result = await Bids.findAll({
      where: {
        ...whereQuery,
        ...(dates.startDate &&
          dates.endDate && {
          [status.includes(BID_TYPES.CONTRACTS)
            ? "contractDate"
            : status.includes(BID_TYPES.LEADS)
              ? "responseDate"
              : "createdAt"]: {
            [Op.between]: [dates.startDate, dates.endDate],
          },
        }),
      },
      attributes: {
        include: [
          [
            Sequelize.literal(
              `( SELECT name FROM "workspaces" as comp WHERE comp."id" = '${user.companyId}' )`
            ),
            "company",
          ],
          [
            Sequelize.literal(
              `( SELECT u.name FROM users u WHERE "Bids"."userId" = u.id )`
            ),
            "user",
          ],
          [
            Sequelize.literal(
              `(SELECT u."deletedAt" FROM users u WHERE "Bids"."userId" = u.id)`
            ),
            "deletedAt",
          ],
        ],
      },
      order,
      offset,
      limit: bidsPerPage,
      include: [
        {
          model: Profiles,
          attributes: ["id", "name"],
        },
        {
          model: Contacts,
          ...(location.length && {
            where: {
              locationCountry: location
            },
          }),
        },
        {
          model: Jobs,
          as: 'job',
          required: false,
          include: [
            {
              model: JobsTags,
              required: false,
              attributes: ['tagId'],
              where: {
                workspaceId: user.companyId,
              },
              include: [
                {
                  model: Tags,
                  required: false,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
        jobInclude,
      ],
    });

    return {
      message: bidsMessages.allBidsFetched(status ? status.join(', ') : ""),
      data: result,
      dataCount: bidsCount,
      dataPerPage: bidsPerPage,
      page: totalPages < page ? 1 : page,
      totalPages,
      counts: {
        proposals: proposalsCount,
        leads: leadsCount,
        contracts: contractsCount,
      },
    };
  }

  async countBiddersBids(
    user: Users,
    timeZone: string,
    dates?: DateProps,
    bidderId?: string
  ) {
    try {
      const { userIds } = await this.getUserIds(
        user,
        false,
        bidderId ? [bidderId] : []
      );

      if (!userIds.length) {
        return {
          bidsCount: 0,
          securedJobsCount: 0,
          leadsCount: 0,
          totalBidsCount: 0,
          totalLeadsCount: 0,
          invitesCount: 0,
          inviteJobs: 0,
          directCount: 0,
          directContractsCount: 0,
          totalContractsCount: 0,
          bidsCountByState: [],
          bidsCountByCategory: [],
          bidsCountByProfile: [],
          bidsCountByBidders: [],
          bidsMonthlyReport: [],
          bidsHourlyReport: [],
          funnelStats: {},
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
        dialectOptions: +this.configService.get("SSL")
          ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
          : {},
      });

      const bids_and_secure_bids = `
                SELECT
                 COALESCE ( COUNT ( 
                  CASE WHEN 
                    "invite" = false 
                    AND "isManual" = false 
                    ${dates.startDate && dates.endDate
          ? `AND "createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                  THEN 1 END ), 0) AS "bidsCount",

                COALESCE( COUNT ( 
                  CASE WHEN 
                    invite = false 
                    AND "isManual" = false 
                    AND "bidResponse" = true 
                    ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                  THEN 1 END) , 0) AS "leadsCount",

                COALESCE( COUNT ( 
                  CASE WHEN 
                    invite = false 
                    AND "isManual" = false 
                    AND "bidResponse" = true 
                    AND "status" = '${BidStatus.COMPLETED}' 
                    ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                  THEN 1 END) , 0) AS "securedJobsCount",

                COALESCE( COUNT (
                  CASE WHEN 
                    invite = true 
                    AND "isManual" = false 
                    ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                  THEN 1 END) , 0) AS "invitesCount",

                COALESCE( COUNT ( 
                  CASE WHEN 
                  invite = true 
                  AND "isManual" = false 
                  AND "status" = '${BidStatus.COMPLETED}' 
                  ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                  THEN 1 END) , 0) AS "inviteJobs",

                  COALESCE( COUNT (
                    CASE WHEN 
                      invite = false 
                      AND "isManual" = true 
                      ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END) , 0) AS "directCount",

                    COALESCE( COUNT (
                      CASE WHEN 
                      invite = false 
                      AND "isManual" = true 
                      AND "status" = '${BidStatus.COMPLETED}' 
                      ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                      THEN 1 END) , 0) AS "directContractsCount",

                    COALESCE ( COUNT (
                      CASE WHEN
                      ${dates.startDate && dates.endDate
          ? `"createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                      THEN 1 END ), 0) AS "totalBidsCount",

                    COALESCE( COUNT ( 
                      CASE WHEN 
                     "bidResponse" = true 
                    ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                      THEN 1 END) , 0) AS "totalLeadsCount",

                    COALESCE( COUNT (
                      CASE WHEN   
                     "status" = '${BidStatus.COMPLETED}' 
                      ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                      THEN 1 END) , 0) AS "totalContractsCount"

                FROM
                    "bids"
                WHERE
                    "userId" IN (:userIds)
                    AND "deletedAt" IS NULL
      `;

      const funnel_graph_stats = `
            SELECT
                COALESCE(COUNT(
                    CASE WHEN 
                        "invite" = false 
                        AND "isManual" = false 
                        AND status = '${BidStatus.PENDING}'
                        ${dates.startDate && dates.endDate
          ? `AND "createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END), 0) AS "proposalsCount",

                COALESCE(COUNT(
                    CASE WHEN 
                        "invite" = false 
                        AND "isManual" = false 
                        AND "bidResponse" = true 
                        AND status = '${BidStatus.ACTIVE}'
                        ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END), 0) AS "leadsCount",

                COALESCE(COUNT(
                    CASE WHEN 
                        "invite" = false 
                        AND "isManual" = false 
                        AND "bidResponse" = true 
                        AND status = '${BidStatus.COMPLETED}' 
                        ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END), 0) AS "contractsCount",

                COALESCE(COUNT(
                    CASE WHEN 
                        "invite" = true 
                        AND "isManual" = false 
                        AND status = '${BidStatus.ACTIVE}' 
                        ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END), 0) AS "inviteLeadsCount",

                COALESCE(COUNT(
                    CASE WHEN 
                        "invite" = true 
                        AND "isManual" = false 
                        AND status = '${BidStatus.COMPLETED}' 
                        ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END), 0) AS "inviteContractsCount",

                COALESCE(COUNT(
                    CASE WHEN 
                        "invite" = false 
                        AND "isManual" = true 
                        AND status = '${BidStatus.ACTIVE}' 
                        ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END), 0) AS "directLeadsCount",

                COALESCE(COUNT(
                    CASE WHEN 
                        "invite" = false 
                        AND "isManual" = true 
                        AND status = '${BidStatus.COMPLETED}' 
                        ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                    THEN 1 END), 0) AS "directContractsCount"

            FROM
                "bids"
            WHERE
                "userId" IN (:userIds)
                AND "deletedAt" IS NULL
      `;
      const funnel_stats_result = `
           SELECT 
            jsonb_build_object(
                'proposalsCount', "proposalsCount",
                'leadsCount', "leadsCount",
                'contractsCount', "contractsCount",
                'inviteLeadsCount', "inviteLeadsCount",
                'inviteContractsCount', "inviteContractsCount",
                'directLeadsCount', "directLeadsCount",
                'directContractsCount', "directContractsCount"
            ) as "result" FROM funnel_stats 
      `; 

      const monthly_report_data = `
      months AS (
        SELECT TO_CHAR(
            generate_series(
                GREATEST(
                    (SELECT MIN("createdAt" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}')::DATE 
                    FROM "bids" 
                    WHERE 
                      "deletedAt" IS NULL
                      AND "userId" IN (:userIds)
                      ${dates.startDate && dates.endDate
          ? `AND "createdAt" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
                  )
                ),
                ('${moment(dates.endDate)
          .endOf("month")
          .toISOString()}' :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}')::DATE,
                '1 month'
            ), 'Mon - YYYY'
        ) AS "month"
    ),

      bids_data AS (
        SELECT 
            TO_CHAR("createdAt" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}', 'Mon - YYYY') AS "month",
            COUNT(*) AS "bidsCount"
        FROM "bids"
        WHERE 
            invite = FALSE 
            AND "isManual" = FALSE
            AND "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "createdAt" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      
      leads_data AS (
        SELECT 
            TO_CHAR("responseDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}' , 'Mon - YYYY') AS "month",
            COUNT(*) AS "leadsCount"
        FROM "bids"
        WHERE 
            invite = FALSE 
            AND "isManual" = FALSE 
            AND "bidResponse" = TRUE
            AND "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      
      contracts_data AS (
        SELECT 
            TO_CHAR("contractDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}' , 'Mon - YYYY') AS "month",
            COUNT(*) AS "contractsCount"
        FROM "bids"
        WHERE 
            invite = FALSE 
            AND "isManual" = FALSE 
            AND "bidResponse" = TRUE 
            AND "status" = '${BidStatus.COMPLETED}'
            AND "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      
      invites_data AS (
        SELECT 
            TO_CHAR("responseDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}' , 'Mon - YYYY') AS "month",
            COUNT(*) AS "invitesCount"
        FROM "bids"
        WHERE 
            invite = TRUE 
            AND "isManual" = FALSE
            AND "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      
      invite_contracts_data AS (
        SELECT 
            TO_CHAR("contractDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}' , 'Mon - YYYY') AS "month",
            COUNT(*) AS "inviteContractsCount"
        FROM "bids"
        WHERE 
            invite = TRUE 
            AND "isManual" = FALSE 
            AND "status" = '${BidStatus.COMPLETED}'
            AND "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      
      direct_data AS (
        SELECT 
            TO_CHAR("responseDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}' , 'Mon - YYYY') AS "month",
            COUNT(*) AS "directCount"
        FROM "bids"
        WHERE 
            invite = FALSE 
            AND "isManual" = TRUE
            AND "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      
      direct_contracts_data AS (
        SELECT 
            TO_CHAR("contractDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}' , 'Mon - YYYY') AS "month",
            COUNT(*) AS "directContractsCount"
        FROM "bids"
        WHERE 
            invite = FALSE 
            AND "isManual" = TRUE 
            AND "status" = '${BidStatus.COMPLETED}'
            AND "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "contractDate" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      
      connects_data AS (
        SELECT 
            TO_CHAR("createdAt" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE '${timeZone}' , 'Mon - YYYY') AS "month",
            SUM(
                CASE 
                    WHEN REGEXP_REPLACE(connects, '[^0-9]', '', 'g') <> '' 
                    THEN CAST(REGEXP_REPLACE(connects, '[^0-9]', '', 'g') AS INTEGER) 
                    ELSE 0 
                END
            ) AS "totalConnects"
        FROM "bids"
        WHERE 
            "userId" IN (:userIds)
            AND "deletedAt" IS NULL
            ${dates.startDate && dates.endDate
          ? `AND "createdAt" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
        GROUP BY "month"
      ),
      `;
      const bids_monthly_report = `
        SELECT 
            m."month",
            COALESCE(b."bidsCount", 0) AS "bidsCount",
            COALESCE(l."leadsCount", 0) AS "leadsCount",
            COALESCE(c."contractsCount", 0) AS "contractsCount",
            COALESCE(i."invitesCount", 0) AS "invitesCount",
            COALESCE(ic."inviteContractsCount", 0) AS "inviteContractsCount",
            COALESCE(d."directCount", 0) AS "directCount",
            COALESCE(dc."directContractsCount", 0) AS "directContractsCount",
            COALESCE(b."bidsCount", 0) AS "totalProposalsCount",
            COALESCE(con."totalConnects", 0) AS "totalConnects"
        FROM 
          months m
          LEFT JOIN bids_data b ON m."month" = b."month"
          LEFT JOIN leads_data l ON m."month" = l."month"
          LEFT JOIN contracts_data c ON m."month" = c."month"
          LEFT JOIN invites_data i ON m."month" = i."month"
          LEFT JOIN invite_contracts_data ic ON m."month" = ic."month"
          LEFT JOIN direct_data d ON m."month" = d."month"
          LEFT JOIN direct_contracts_data dc ON m."month" = dc."month"
          LEFT JOIN connects_data con ON m."month" = con."month"
        ORDER BY TO_DATE(m."month", 'Mon - YYYY')
      `;
      const monthly_report_final_result = `
        SELECT 
        jsonb_agg(
            jsonb_build_object(
                'month', "month",
                'bidsCount', "bidsCount",
                'leadsCount', "leadsCount",
                'contractsCount', "contractsCount",
                'invitesCount', "invitesCount",
                'inviteContractsCount', "inviteContractsCount",
                'directCount', "directCount",
                'directContractsCount', "directContractsCount",
                'totalProposalsCount', "totalProposalsCount",
                'totalConnects', "totalConnects"
            )
        ) AS "result"
        FROM bids_monthly_report
      `;

      const bids_hourly_report = `
          SELECT 
            jsonb_build_object(
              'hour', hour_base."hour",  -- Textual hour range
              'bidsCount', COALESCE(bids_subquery."bidsCount", 0),  -- Bids count
              'leadsCount', COALESCE(leads_subquery."leadsCount", 0)  -- Leads count
            ) AS "result"
          FROM (
            -- Generate all hours of the day
            SELECT 
              CONCAT(
                TO_CHAR("hour_table"."hour", 'HH12 AM'), -- Start hour
                ' to ',
                TO_CHAR("hour_table"."hour" + INTERVAL '1 hour', 'HH12 AM') -- Next hour
              ) AS "hour",
              EXTRACT(HOUR FROM "hour_table"."hour") AS "hour_value" -- Extract hour as numeric value
            FROM generate_series(
              '2024-01-01 00:00'::timestamp, 
              '2024-01-01 23:00'::timestamp, 
              '1 hour'
            ) AS hour_table("hour")
          ) AS hour_base

          -- Subquery for bidsCount based on createdAt
          LEFT JOIN (
            SELECT 
              EXTRACT(HOUR FROM "createdAt" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE :timeZone) AS "hour_value",
              COUNT(CASE WHEN invite = FALSE AND "isManual" = false THEN 1 END) AS "bidsCount"
            FROM 
              "bids"
            WHERE 
              "userId" IN (:userIds)
              AND "deletedAt" IS NULL
              ${dates.startDate && dates.endDate
          ? `AND "createdAt" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
            GROUP BY 
              EXTRACT(HOUR FROM "createdAt" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE :timeZone)
          ) AS bids_subquery
          ON hour_base."hour_value" = bids_subquery."hour_value"

          -- Subquery for leadsCount based on responseDate
          LEFT JOIN (
            SELECT 
              EXTRACT(HOUR FROM "responseDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE :timeZone) AS "hour_value",
              COUNT(CASE WHEN invite = FALSE AND "isManual" = false AND "bidResponse" = true THEN 1 END) AS "leadsCount"
            FROM 
              "bids"
            WHERE 
              "userId" IN (:userIds)
              AND "deletedAt" IS NULL
              ${dates.startDate && dates.endDate
          ? `AND "responseDate" BETWEEN '${moment(
            dates.startDate
          ).toISOString()}' AND '${moment(
            dates.endDate
          ).toISOString()}'`
          : ""
        }
            GROUP BY 
              EXTRACT(HOUR FROM "responseDate" :: TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE :timeZone)
          ) AS leads_subquery
          ON hour_base."hour_value" = leads_subquery."hour_value"
      `;

      const bids_by_country = `
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'state', bids.state, 
        'bidsCount', COALESCE(bids.bidsCount, 0),
        'leadsCount', COALESCE(bids.leadsCount, 0),
        'jobsCount', COALESCE(bids.jobsCount, 0),
        'invitesCount', COALESCE(bids.invitesCount, 0)
      )) FILTER (WHERE bids.state IS NOT NULL), '[]')
       as "bidsCountByState"
        FROM (
            SELECT
                a."locationCountry" AS state,
                COUNT(CASE WHEN b.invite = false THEN 1 END) AS bidsCount,
                COUNT(CASE WHEN b."status" = '${BidStatus.ACTIVE
        }' AND b.invite = false THEN 1 END) AS leadsCount,
                          COUNT(CASE WHEN b."status" = '${BidStatus.COMPLETED
        }' THEN 1 END) AS jobsCount,
                COUNT(CASE WHEN b.invite = true THEN 1 END) AS invitesCount
            FROM
                "bids" b
            JOIN
                "jobs" j ON b."jobId" = j."id"
            JOIN
                "contacts" a ON j."id" = a."jobId"
            WHERE
                b."deletedAt" IS NULL
                AND a."locationCountry" != ''
                AND b."userId" IN (:userIds)
                ${dates.startDate && dates.endDate
          ? `AND b."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
            GROUP BY
                a."locationCountry"
            ORDER BY
                bidsCount DESC
        ) bids
      `;

      const bids_count_by_category = `
                  SELECT
                  COALESCE(jsonb_agg(jsonb_build_object (
                    'category', category, 
                    'bidsCount', "bidsCount", 
                    'leadsCount', "leadsCount",
                    'contractsCount', "contractsCount",
                    'invitesCount', "invitesCount",
                    'inviteContracts', "inviteContracts",
                    'directLeadsCount', "directLeadsCount",
                    'directContractsCount', "directContractsCount"
                  )), '[]') 
                  AS RESULT 
                FROM (
                    SELECT
                        j.category,
                        
                        COALESCE ( COUNT ( 
                          CASE WHEN 
                            b.invite = false 
                            AND b."isManual" = false 
                            ${dates.startDate && dates.endDate
          ? `AND b."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                          THEN 1 END ), 0) AS "bidsCount",
        
                        COALESCE( COUNT ( 
                          CASE WHEN 
                            b.invite = false 
                            AND b."isManual" = false 
                            AND b."bidResponse" = true 
                            ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                          THEN 1 END) , 0) AS "leadsCount",
        
                        COALESCE( COUNT ( 
                          CASE WHEN 
                             b.invite = false 
                            AND b."isManual" = false 
                            AND b."bidResponse" = true 
                            AND b."status" = '${BidStatus.COMPLETED}' 
                            ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                          THEN 1 END) , 0) AS "contractsCount",
        
                        COALESCE( COUNT (
                          CASE WHEN 
                            b.invite = true 
                            AND b."isManual" = false 
                            ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                          THEN 1 END) , 0) AS "invitesCount",
        
                        COALESCE( COUNT (
                          CASE WHEN 
                          b.invite = true 
                          AND b."isManual" = false 
                          AND b."status" = '${BidStatus.COMPLETED}' 
                          ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                          THEN 1 END) , 0) AS "inviteContracts",
        
                          COALESCE( COUNT (
                            CASE WHEN 
                              b.invite = false 
                              AND b."isManual" = true 
                              ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                          THEN 1 END) , 0) AS "directLeadsCount",
        
                         COALESCE( COUNT (
                           CASE WHEN 
                           b.invite = false 
                           AND b."isManual" = true 
                           AND b."status" = '${BidStatus.COMPLETED}' 
                           ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                           THEN 1 END) , 0) AS "directContractsCount"

                    FROM
                        "bids" b
                        JOIN "jobs" j ON b."jobId" = j."id"
                    WHERE
                        b."deletedAt" IS NULL 
                        AND j.category IS NOT NULL 
                        AND b."userId" IN (:userIds)
                        ${dates.startDate && dates.endDate
          ? `AND (
                            b."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}' OR
                            b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}' OR
                            b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'
                          )`
          : ""
        }
                    GROUP BY
                        j.category
                    ORDER BY
                    "bidsCount" DESC
                ) subquery_alias_bids_count_by_category
      `;

      const bids_count_by_profile = `
                  SELECT 
                  COALESCE(jsonb_agg ( jsonb_build_object ( 
                    'name', COALESCE(profile_name, ''), 
                    'deletedAt', COALESCE(profile_deleted_at, NULL),
                    'bidsCount', "bidsCount", 
                    'leadsCount', "leadsCount",
                    'contractsCount', "contractsCount",
                    'invitesCount', "invitesCount",
                    'inviteContracts', "inviteContracts",
                    'directLeadsCount', "directLeadsCount",
                    'directContractsCount', "directContractsCount"
                  )), '[]')
                  AS result
                  FROM (
                    SELECT 
                      P.NAME AS profile_name,
                      P."deletedAt" AS profile_deleted_at,

                      COALESCE ( COUNT ( 
                       CASE WHEN 
                         b.invite = false 
                         AND b."isManual" = false 
                         ${dates.startDate && dates.endDate
          ? `AND b."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                       THEN 1 END ), 0) AS "bidsCount",
     
                     COALESCE( COUNT ( 
                       CASE WHEN 
                         b.invite = false 
                         AND b."isManual" = false 
                         AND b."bidResponse" = true 
                         ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                       THEN 1 END) , 0) AS "leadsCount",
     
                     COALESCE( COUNT ( 
                       CASE WHEN 
                          b.invite = false 
                         AND b."isManual" = false 
                         AND b."bidResponse" = true 
                         AND b."status" = '${BidStatus.COMPLETED}' 
                         ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                       THEN 1 END) , 0) AS "contractsCount",
     
                     COALESCE( COUNT (
                       CASE WHEN 
                         b.invite = true 
                         AND b."isManual" = false 
                         ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                       THEN 1 END) , 0) AS "invitesCount",
     
                     COALESCE( COUNT (
                       CASE WHEN 
                       b.invite = true 
                       AND b."isManual" = false 
                       AND b."status" = '${BidStatus.COMPLETED}' 
                       ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                       THEN 1 END) , 0) AS "inviteContracts",
     
                       COALESCE( COUNT (
                         CASE WHEN 
                           b.invite = false 
                           AND b."isManual" = true 
                           ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                       THEN 1 END) , 0) AS "directLeadsCount",
     
                      COALESCE( COUNT (
                        CASE WHEN 
                        b.invite = false 
                        AND b."isManual" = true 
                        AND b."status" = '${BidStatus.COMPLETED}' 
                        ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        }
                        THEN 1 END) , 0) AS "directContractsCount"
    
                    FROM
                      "bids" b
                      JOIN "profiles" P ON b."bidProfileId" = P."id" 
                    WHERE
                      b."deletedAt" IS NULL 
                      AND b."userId" IN (:userIds)
                    GROUP BY
                      P.NAME,
                      P."deletedAt"
                    ORDER BY
                      "bidsCount" DESC
                  ) subquery_alias_bids_count_by_profile
      `;

      const target_calculations = `
          SELECT
            u.id AS user_id,
            u.NAME AS NAME,
            u."deletedAt" AS "userDeletedAt",
            COUNT(CASE WHEN b.invite = false AND b."isManual" = false ${dates.startDate && dates.endDate
          ? `AND b."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "bidsCount",
            COUNT(CASE WHEN b."bidResponse" = true AND b.invite = false AND b."isManual" = false ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "securedJobsCount",
            COUNT(CASE WHEN b."bidResponse" = true AND b.invite = false AND b."isManual" = false AND b."status" = '${BidStatus.COMPLETED
        }' ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "leadsWonCount",
            COUNT(CASE WHEN b.invite = true AND b."isManual" = false  ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "invitesCount",
            COUNT(CASE WHEN b.invite = true AND b."isManual" = false AND b."status" = '${BidStatus.COMPLETED
        }'  ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "inviteContractsCount",
            COUNT(CASE WHEN b."bidResponse" = true AND b."isManual" = true AND b.invite = false  ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "directLeadsCount",
            COUNT(CASE WHEN b."bidResponse" = true AND b."isManual" = true AND b.invite = false AND b."status" = '${BidStatus.COMPLETED
        }'  ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "directContractsCount",
            COUNT(CASE WHEN b.invite = false ${dates.startDate && dates.endDate
          ? `AND b."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "totalBidsCount",
            COUNT(CASE WHEN b."bidResponse" = true  ${dates.startDate && dates.endDate
          ? `AND b."responseDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "totalSecuredJobsCount",
            COUNT(CASE WHEN b."bidResponse" = true AND b."status" = '${BidStatus.COMPLETED
        }'  ${dates.startDate && dates.endDate
          ? `AND b."contractDate" BETWEEN '${dates.startDate}' AND '${dates.endDate}'`
          : ""
        } THEN 1 END) AS "totalLeadsWonCount",
            uth."target",
            uth."validFrom",
            uth."validTo",
            u."createdAt"
          FROM
            "users" u
          LEFT JOIN 
            "bids" b ON b."userId" = u."id"
          LEFT JOIN 
            "user-target-history" uth ON u."id" = uth."userId" AND uth.type = '${SOURCE.UPWORK
        }'
          WHERE
            b."deletedAt" IS NULL 
            AND u."id" IN (:userIds)
          GROUP BY
            u.id, u.NAME, uth."target", uth."validFrom", uth."validTo", u."createdAt", u."deletedAt"
      `;
      const filtered_logs = `
          SELECT DISTINCT ON (dl."bidId") 
            dl."userId", 
            dl."bidId", 
            b."responseDate" AS responseDate, 
            dl."createdAt" AS replyDate,
            justify_interval(dl."createdAt" - b."responseDate") AS responseTime
          FROM deal_logs dl
          JOIN bids b ON b.id = dl."bidId" 
          WHERE dl."dealLogType" IN ('${DEAL_LOG_TYPE.LEAD_SYNCED}', '${DEAL_LOG_TYPE.JOB_CREATED}') AND dl."createdAt" BETWEEN '${dates.startDate}' AND '${dates.endDate}'
          ORDER BY dl."bidId", dl."createdAt" ASC
      `;
      const aggregated_logs = `
          SELECT 
            fl."userId", 
            AVG(fl.responseTime) AS avgResponseTime
          FROM filtered_logs fl
          GROUP BY fl."userId"
      `;
      const month_targets = `
          SELECT
					  tc.user_id as id,
            tc.NAME,
						al.avgResponseTime AS "responseTime",
            tc."bidsCount",
            tc."securedJobsCount",
            tc."leadsWonCount",
            tc."invitesCount",
            tc."inviteContractsCount",
            tc."directLeadsCount",
            tc."directContractsCount",
            tc."totalBidsCount",
            tc."totalSecuredJobsCount",
            tc."totalLeadsWonCount",
            tc."userDeletedAt",
            SUM(
              CASE
                WHEN 
                  ("validTo" IS NULL) AND (('${dates.startDate
        }' BETWEEN "validFrom" AND '${moment().toISOString()}') OR ('${dates.endDate
        }' BETWEEN "validFrom" AND '${moment().endOf("month").toISOString()}') )
                THEN
                  EXTRACT(YEAR FROM DATE_TRUNC('month', '${dates.endDate
        }'::timestamp)) * 12 + EXTRACT(MONTH FROM DATE_TRUNC('month', '${dates.endDate
        }'::timestamp))
                  - EXTRACT(YEAR FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(
          dates.startDate
        )
          .add(10, "hour")
          .toISOString()}') )) * 12 - EXTRACT(MONTH FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(
            dates.startDate
          )
            .add(10, "hour")
            .toISOString()}') )) + 1
                WHEN 
                  ('${dates.startDate
        }' BETWEEN "validFrom" AND COALESCE("validTo", '${moment().toISOString()}')) OR ("validTo" BETWEEN '${dates.startDate
        }' AND '${dates.endDate}')
                THEN
                  EXTRACT(YEAR FROM DATE_TRUNC('month', LEAST("validTo", '${dates.endDate
        }')::timestamp)) * 12 + EXTRACT(MONTH FROM DATE_TRUNC('month', LEAST("validTo", '${dates.endDate
        }')::timestamp))
                  - EXTRACT(YEAR FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(
          dates.startDate
        )
          .add(10, "hour")
          .toISOString()}')::timestamp)) * 12 - EXTRACT(MONTH FROM DATE_TRUNC('month', GREATEST("validFrom", '${moment(
            dates.startDate
          )
            .add(10, "hour")
            .toISOString()}')::timestamp)) + 1
              END * "target"
            ) AS "target"
          FROM
            target_calculations as tc
					LEFT JOIN aggregated_logs al ON al."userId" = tc.user_id
          GROUP BY
          tc.user_id, al.avgResponseTime, tc.NAME, tc."bidsCount", tc."totalBidsCount", tc."securedJobsCount", tc."totalSecuredJobsCount", tc."directLeadsCount", tc."leadsWonCount", tc."totalLeadsWonCount", tc."invitesCount", tc."userDeletedAt", tc."inviteContractsCount", tc."directContractsCount"
      `;
      const sorted_targets = `
            SELECT
              id,
              NAME,
              JUSTIFY_INTERVAL("responseTime") as "responseTime", 
              "bidsCount",
              "securedJobsCount",
              "leadsWonCount",
              "invitesCount",
              "inviteContractsCount",
              "directLeadsCount",
              "directContractsCount",
              "totalBidsCount",
              "totalSecuredJobsCount",
              "totalLeadsWonCount",
              "userDeletedAt",
              COALESCE(SUM("target"), 0) AS "target"
            FROM
              month_targets
            GROUP BY
              NAME, id, "responseTime", "bidsCount", "totalBidsCount", "securedJobsCount","totalSecuredJobsCount", "directLeadsCount", "leadsWonCount", "totalLeadsWonCount", "invitesCount", "userDeletedAt", "inviteContractsCount", "directContractsCount"
            ORDER BY
              "bidsCount" DESC
      `;
      const bids_count_by_bidders = `
          SELECT
          jsonb_agg(
            jsonb_build_object(
              'name', NAME,
              'responseTime', "responseTime",
              'bidsCount', "bidsCount",
              'securedJobsCount', "securedJobsCount",
              'leadsWonCount', "leadsWonCount",
              'invitesCount', "invitesCount",
              'inviteContractsCount', "inviteContractsCount",
              'directLeadsCount', "directLeadsCount",
              'directContractsCount', "directContractsCount",
              'totalBidsCount', "totalBidsCount",
              'totalSecuredJobsCount', "totalSecuredJobsCount",
              'totalLeadsWonCount', "totalLeadsWonCount",
              'userDeletedAt', "userDeletedAt",
              'target', "target"
            )
          ) AS result
        FROM
          sorted_targets
          WHERE  (
              -- Include if any of the counts is non-zero
              ("userDeletedAt" IS NULL AND (
                "bidsCount" != 0 OR
                "securedJobsCount" != 0 OR
                "leadsWonCount" != 0 OR
                "invitesCount" != 0 OR
                "inviteContractsCount" != 0 OR
                "directLeadsCount" != 0 OR
                "directContractsCount" != 0 OR
                "totalBidsCount" != 0 OR
                "totalSecuredJobsCount" != 0 OR
                "totalLeadsWonCount" != 0 OR
                "target" != 0
              ))
              OR
              -- Include if any count is zero but the user is deleted
              ("userDeletedAt" IS NOT NULL AND (
                  "bidsCount" != 0 OR
                  "securedJobsCount" != 0 OR
                  "leadsWonCount" != 0 OR
                  "invitesCount" != 0 OR
                  "inviteContractsCount" != 0 OR
                  "directLeadsCount" != 0 OR
                  "directContractsCount" != 0 OR
                  "totalBidsCount" != 0 OR
                  "totalSecuredJobsCount" != 0 OR
                  "totalLeadsWonCount" != 0
              ))
            )
      `;

      const query = `
      WITH bids_and_secure_bids AS (${bids_and_secure_bids}),
      
      ${monthly_report_data}
      bids_monthly_report AS (${bids_monthly_report}),
      final_result AS (${monthly_report_final_result}),
      
      bids_hourly_report AS (${bids_hourly_report}),

      bids_by_country AS (${bids_by_country}), 

      bids_count_by_category AS (${bids_count_by_category}),

      bids_count_by_profile AS (${bids_count_by_profile}),

      funnel_stats AS (${funnel_graph_stats}),
      funnel_stats_result AS (${funnel_stats_result}),

      target_calculations AS (${target_calculations}),
      filtered_logs AS (${filtered_logs}),
      aggregated_logs AS (${aggregated_logs}),
      month_targets AS (${month_targets}),
      sorted_targets AS (${sorted_targets}),
      bids_count_by_bidders AS (${bids_count_by_bidders})

      SELECT
        jsonb_build_object(
          'bidsCount', (SELECT "bidsCount" FROM bids_and_secure_bids),
          'totalBidsCount', (SELECT "totalBidsCount" FROM bids_and_secure_bids),
          'securedJobsCount', (SELECT "securedJobsCount" FROM bids_and_secure_bids),
          'leadsCount', (SELECT "leadsCount" FROM bids_and_secure_bids),
          'totalLeadsCount', (SELECT "totalLeadsCount" FROM bids_and_secure_bids),
          'invitesCount', (SELECT "invitesCount" FROM bids_and_secure_bids),
          'inviteJobs', (SELECT "inviteJobs" FROM bids_and_secure_bids),
          'directCount', (SELECT "directCount" FROM bids_and_secure_bids),
          'directContractsCount', (SELECT "directContractsCount" FROM bids_and_secure_bids),
          'totalContractsCount', (SELECT "totalContractsCount" FROM bids_and_secure_bids),
          'bidsCountByState', (SELECT "bidsCountByState" FROM bids_by_country),
          'bidsCountByCategory', (SELECT result FROM bids_count_by_category),
          'bidsCountByProfile', (SELECT result FROM bids_count_by_profile),
          'bidsMonthlyReport', (SELECT result FROM final_result),
          'bidsHourlyReport', (SELECT jsonb_agg("result") FROM bids_hourly_report),
          'bidsCountByBidders', (SELECT result FROM bids_count_by_bidders),
          'funnelStats', (SELECT result FROM funnel_stats_result)
      ) AS results
        `;

      const replacements = { userIds, timeZone };
      const results: any = await sequelize.query(query, { replacements });
      const data = results[0][0]["results"];

      return {
        message: bidsMessages.bidsCountFetched,
        ...data,
      };
    } catch (err: any) {
      console.error(err);
      throw new InternalServerErrorException(bidsMessages.bidsCountError);
    }
  }

  public async getAllBids(
    userIds: string[] | string,
    search: string,
    profile: string,
    page: number
  ) {
    try {
      const bidsPerPage = 20;
      const offset = (page - 1) * bidsPerPage;

      let jobIds: string[] = [];

      let options: any = {
        where: {
          userId: userIds,
          ...(profile && { bidProfileId: profile }),
        },
        offset,
        limit: bidsPerPage,
        order: [["createdAt", "DESC"]],
      };

      // If search query is provided, filter jobs based on category
      if (search) {
        const { jobIds: theJobIds } = await this.jobService.getJobIds(search);
        jobIds = theJobIds;
        options.where.jobId = jobIds;
      }
      const bids = await Bids.findAll(options);
      let bidsCount = await Bids.count({
        where: options.where,
      });

      return {
        message: bidsMessages.getAllBids,
        bids,
        bidsPerPage,
        bidsCount,
      };
    } catch (err: any) {
      console.error(err);
      throw new InternalServerErrorException(bidsMessages.allBidsFetchedError);
    }
  }

  async getUserIds(
    user: Users,
    allowAll: boolean,
    bidderId?: string[]
  ): Promise<{ userIds: string[] }> {
    if (user.role === ROLES.BIDDER && !allowAll) {
      return { userIds: [user.id] };
    } else if (user.role === ROLES.COMPANY_ADMIN || user.role === ROLES.OWNER || allowAll) {
      if (bidderId?.length) {
        const Bidder = await Users.findOne({
          where: {
            id: bidderId,
            companyId: user.companyId,
          },
          paranoid: false,
        });
        if (!Bidder) return { userIds: [] };

        return { userIds: bidderId };
      }
      const users = await Users.findAll({
        where: {
          companyId: user.companyId,
          role: {
            [Op.in]: [ROLES.BIDDER, ROLES.COMPANY_ADMIN, ROLES.OWNER],
          },
        },
        paranoid: false,
      });

      const userIds = users.map((user: Users) => user.id);
      return { userIds };
    } else return { userIds: [] };
  }
}
