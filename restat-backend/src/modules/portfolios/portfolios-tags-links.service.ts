import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Portfolios } from "src/common/models/portfolios.model";
import { EXCEPTIONS } from "src/common/constants/exceptions";
import { TagService } from "../tags/tags.service";
import { LinkService } from "../links/links.service";
import { PortfolioService } from "./portfolios.service";
import { PortfolioDto } from "./dto/portfolio.dto";
import { UpdatePortfolioDto } from "./dto/updatePortfolio.dto";
import { PORTFOLIO_TYPE } from "src/common/constants/portfolio_type";
import { PortfoliosTags } from "src/common/models/portfolios-tags.model";
import { Tags } from "src/common/models/tags.model";
import { Links } from "src/common/models/links.model";
import { Op } from "sequelize";
import { Source } from "src/types/enum";
import { portfoliosMessages, tagMessages } from "src/common/constants/messages";

@Injectable()
export class PortfolioLinksTagsService {
  constructor(
    private readonly tagService: TagService,
    private readonly linkService: LinkService,
    private readonly portfolioService: PortfolioService
  ) { }

  public async createPortfolio(companyId: string, portfolioDto: PortfolioDto) {
    const { name, type, description, links, tags } = portfolioDto;
    const portfolioAlreadyExist = await Portfolios.findOne({
      where: { name, companyId },
    });
    if (portfolioAlreadyExist) {
      throw new ConflictException(portfoliosMessages.portfolioAlreadyExists);
    }
    const portfolio = await Portfolios.create({
      name,
      type,
      description,
      companyId,
    });

    if (links) {
      const { error, existingLinks, duplicateUrls } = await this.linkService.createLink(companyId, links, portfolio.id);
      if (error || existingLinks || duplicateUrls) {
        await this.portfolioService.deletePortfolioById(portfolio.id);
        if (duplicateUrls) {
          throw new ConflictException(portfoliosMessages.duplicateUrl);
        }
        if (existingLinks) {
          throw new ConflictException(portfoliosMessages.duplicateUrl);
        }
        throw new InternalServerErrorException(portfoliosMessages.portfolioCreateError);
      }
    }
    if (tags) {
      const createdTags = await portfolio.assignPortfoloTags(tags);
      if (!createdTags) {
        throw new InternalServerErrorException(tagMessages.tagCreateError);
      }
    }
    return {
      message: portfoliosMessages.portfolioCreated,
      portfolio,
    };

  }

  public async uploadPortfoliosFromExcel(
    companyId: string,
    bulkPortfoliosDto: PortfolioDto[],
  ) {
    const createdPortfolios = [];
    for (const portfolioDto of bulkPortfoliosDto) {
      const { name, type, description, links, tags } = portfolioDto;
      if (!Object.values(PORTFOLIO_TYPE).includes(type)) {
        throw new ConflictException(portfoliosMessages.portfolioTypeInvalid);
      }

      const portfolioAlreadyExist = await Portfolios.findOne({
        where: { name, companyId },
      });

      if (portfolioAlreadyExist) {
        throw new ConflictException(
          `${portfoliosMessages.portfolioAlreadyExists}: ${name}`,
        );
      }

      const portfolio = await Portfolios.create({
        name,
        type,
        description,
        companyId,
      });

      if (!portfolio) {
        throw new InternalServerErrorException(
          `${portfoliosMessages.portfolioCreateError}: ${name}`,
        );
      }

      if (links) {
        const { error, existingLinks, duplicateUrls } = await this.linkService.createLink(companyId, links, portfolio.id);
        if (error || existingLinks.length || duplicateUrls) {
          await this.portfolioService.deletePortfolioById(portfolio.id);
          if (duplicateUrls) {
            throw new ConflictException(portfoliosMessages.duplicateUrl);
          }
          if (existingLinks) {
            throw new ConflictException(`${portfoliosMessages.duplicateUrl} For : ${name}`,);
          }
          throw new InternalServerErrorException(portfoliosMessages.portfolioCreateError + " internal error");
        }
      }

      if (tags && tags.length > 0) {
        const tagEntities = await this.tagService.createTags(tags, Source.CUSTOM, companyId);
        const createdTags = await portfolio.assignPortfoloTags(tagEntities.tags);
        if (!createdTags) {
          throw new InternalServerErrorException(
            `${tagMessages.tagCreateError}: ${name}`,
          );
        }
      }

      createdPortfolios.push(portfolio);
    }

    return {
      message: portfoliosMessages.bulkPortflioCreated,
      portfolios: createdPortfolios,
    };
  }

  public async updatePortfolio(workspaceId: string, portfolioDto: UpdatePortfolioDto) {
    const { id, name, description, tags, links } = portfolioDto;
    const portfolioExists = await Portfolios.findOne({ where: { id } });
    if (!portfolioExists) {
      throw new ConflictException(EXCEPTIONS.PORTFOLIO_NOT_FOUND);
    }
    const portfolio = await Portfolios.update(
      {
        name,
        description,
      },
      {
        where: {
          id: portfolioDto.id,
        },
      }
    );
    if (!portfolio) {
      throw new InternalServerErrorException(portfoliosMessages.portfolioNotFound);
    }
    try {
      if (links) {
        const { error, existingLinks, duplicateUrls, deletionError } =
          await this.linkService.updatePorfolioLinks(workspaceId, portfolioExists.id, links);
        if (error || existingLinks || duplicateUrls || deletionError) {
          if (duplicateUrls) {
            throw new ConflictException(portfoliosMessages.duplicateUrl);
          }
          if (existingLinks) {
            throw new ConflictException(portfoliosMessages.duplicateUrl);
          }
          throw new InternalServerErrorException(portfoliosMessages.portfolioUpdateError);
        }
      }
      if (tags) {
        const portfolioTags = await portfolioExists.getPortfolioTags(
          portfolioExists.id
        );
        // // make the array of just ids
        const portfolioTagsIds = portfolioTags.map((tag) => tag.tagId);
        const tagsIds = tags.map((tag) => tag.id);
        // Use filter to find tags that are in tags but not in portfolioTags
        const tagsToDelete = portfolioTags.filter(
          (tag) => !tagsIds.includes(tag.tagId)
        );
        const { deletionError } = await portfolioExists.deletePortfolioTags(
          tagsToDelete
        );
        // Use filter to find tags that are in portfolioTags but not in tags
        const tagsToAdd = tags.filter(
          (tag) => !portfolioTagsIds.includes(tag.id)
        );
        await portfolioExists.assignPortfoloTags(tagsToAdd);
        if (!portfolioTags || deletionError) {
          throw new InternalServerErrorException(
            portfoliosMessages.portfolioUpdateError
          );
        }
      }
      return {
        message: portfoliosMessages.portfolioUpdated,
        portfolio,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        portfoliosMessages.portfolioUpdateError
      );
    }
  }

  public async getPortFolioById(id: string, companyId: string) {
    let portfolio = await this.portfolioService.findPorfoilioById(
      id,
      companyId
    );
    const { tags } = await this.tagService.getAllPortfolioTags(
      portfolio.porfoliosTags
    );
    const { links } = await this.linkService.getPortfolioLinks(companyId, portfolio.id);
    // Convert the portfolio instance to a plain JSON object
    portfolio = portfolio.toJSON();

    // delete the extra property of portfolioTags
    delete portfolio.porfoliosTags;

    // Add the tags to the JSON object
    portfolio.tags = tags;
    portfolio.links = links;
    return {
      message: portfoliosMessages.portfolioByIdFetched,
      portfolio,
    };
  }

  public async getAllPortfolios(
    companyId: string,
    page: number,
    searchQuery: string,
    type: PORTFOLIO_TYPE,
    perPage: string = '20',
    sort: string = 'updatedAt',
    selectedTags: string,
  ) {
    try {
      const portfoliosPerPage = +perPage;
      const offset = (page - 1) * portfoliosPerPage;
      const tagIds: string[] = selectedTags ? selectedTags?.split(",") : [];

      const baseOptions: any = {
        where: {
          companyId,
          type: { [Op.ne]: PORTFOLIO_TYPE.CODE_SNIPPET },
        },
      };

      if (type && type !== PORTFOLIO_TYPE.CODE_SNIPPET) {
        baseOptions.where.type = type;
      }

      if (searchQuery) {
        baseOptions.where[Op.or] = [
          { name: { [Op.iLike]: `%${searchQuery}%` } },
          { description: { [Op.iLike]: `%${searchQuery}%` } },
        ];
      }

      if (tagIds.length) {
        baseOptions.include = [
          {
            model: PortfoliosTags,
            required: true,
            attributes: ["tagId"],
            where: {
              tagId: {
                [Op.in]: tagIds
              }
            }
          },
        ]
      }

      let order: any[] = [];

      if (sort === "title") {
        order = [["name", "ASC"]];
      } else if (sort === "type") {
        order = [["type", "ASC"]];
      } else {
        order = [["updatedAt", "DESC"]];
      }

      const portfoliosCount = await Portfolios.count({
        ...baseOptions,
        distinct: ['id'],
      });

      const fetchOptions: any = {
        ...baseOptions,
        include: [
          {
            model: PortfoliosTags,
            attributes: ['id', 'tagId'],
            required: tagIds?.length ? true : false,
            where: {
              ...(tagIds.length ? {
                tagId: {
                  [Op.in]: tagIds
                }
              } : {})
            },
            include: [
              {
                model: Tags,
                required: false,
              },
            ]
          },
          {
            model: Links,
            required: false,
          }
        ],
        offset,
        limit: portfoliosPerPage,
        order,
      };

      const portfoliosRows = await Portfolios.findAll(fetchOptions);

      const portfolios = portfoliosRows.map((portfolio: any) => {
        const { porfoliosTags, ...portfolioData } = portfolio.toJSON();
        return {
          ...portfolioData,
          tags: porfoliosTags?.map((pt: any) => pt?.tags),
        };
      });

      return {
        success: true,
        message: portfoliosMessages.allPortfoliosFetched,
        page,
        portfolios,
        portfoliosCount,
        portfoliosPerPage,
      };
    } catch (error) {
      console.error(error, portfoliosMessages.allPortfoliosFetchedError);
      throw new InternalServerErrorException(
        portfoliosMessages.allPortfoliosFetchedError
      );
    }
  }


  async getMatchedPortfolios(
    companyId: string,
    matchedPortfoliosPage: number,
    type: PORTFOLIO_TYPE,
    tags: any
  ) {
    try {
      if (!tags) {
        throw new NotFoundException(tagMessages.tagNotFound);
      }

      const theTags = tags?.split(",");
      const matchedPortfoliosPerPage = 20;

      const options: any = {
        where: { companyId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: PortfoliosTags,
            attributes: [],
            required: true,
            include: [
              {
                model: Tags,
                attributes: [],
                where: {
                  [Op.or]: theTags.map((tag: string) => ({
                    name: {
                      [Op.iLike]: `%${tag}%`
                    }
                  }))
                }
              },
            ]
          },
          {
            model: Links,
          }
        ],
      };

      if (type) {
        options.where.type = type;
      }

      // Retrieving portfolios with matching tags
      const portfoliosWithMatchingTags = await Portfolios.findAll(options);

      // Pagination
      const matchedPortfoliosCount = portfoliosWithMatchingTags.length;
      const startIndex = (matchedPortfoliosPage - 1) * matchedPortfoliosPerPage;
      const endIndex = Math.min(startIndex + matchedPortfoliosPerPage, matchedPortfoliosCount);

      // retrieving all PortfoliosTags for the same portfolios
      let portfoliosIds = portfoliosWithMatchingTags.slice(startIndex, endIndex).map(portfolio => portfolio.id);
      let allPortfoliosTags = await PortfoliosTags.findAll({
        where: { portfolioId: portfoliosIds },
        attributes: ['id', 'portfolioId'],
        include: [Tags]
      });

      // Merging the results
      let portfolios: any[] = portfoliosWithMatchingTags.slice(startIndex, endIndex).map((portfolio: any) => {
        const { ...portfolioData } = portfolio?.toJSON()
        let allTags = allPortfoliosTags.filter((pt: any) => pt.portfolioId === portfolioData.id).map((pt: any) => pt?.tags);
        return {
          ...portfolioData,
          tags: allTags,
        };
      });

      return {
        success: true,
        message: portfoliosMessages.portfolioByTagsFetched,
        matchedPortfolios: portfolios,
        page: matchedPortfoliosPage,
        matchedPortfoliosCount,
        matchedPortfoliosPerPage,
      };
    } catch (error: any) {
      console.error(error)
      if (error?.response?.statusCode === 404) {
        throw new NotFoundException(portfoliosMessages.portfolioByTagsError + " " + error?.response?.message);
      }
      else {
        throw new InternalServerErrorException(
          portfoliosMessages.portfolioByTagsError
        );
      }

    }
  }

  public async deletePortfolioById(id: string, companyId: string) {
    const { portfolio } = await this.portfolioService.deletePortfolioTags(
      id,
      companyId
    );
    await this.linkService.deletePortfolioLinks(portfolio.id);
    try {
      await Portfolios.destroy({ where: { id: portfolio.id } });
      return {
        message: portfoliosMessages.portfolioDeleted,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        portfoliosMessages.portfolioDeleteError
      );
    }
  }

}
