import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Portfolios } from "src/common/models/portfolios.model";
import { PortfoliosTags } from "src/common/models/portfolios-tags.model";
import { PORTFOLIO_TYPE } from "src/common/constants/portfolio_type";
import { Op } from "sequelize";
import { portfoliosMessages, tagMessages } from "src/common/constants/messages";

@Injectable()
export class PortfolioService {
  constructor() { }

  public async getPortFolioById(id: string) {
    const portfolio = await Portfolios.findByPk(id);
    if (!portfolio) {
      throw new NotFoundException(portfoliosMessages.portfolioNotFound);
    }
    return portfolio;
  }

  // this is is the same function as abive, but it includes the PortfolioTags model as well, so it is defined separately.
  public async findPorfoilioById(id: string, companyId: string) {
    let portfolio = await Portfolios.findOne({
      where: { id, companyId },
      include: [
        {
          model: PortfoliosTags,
          attributes: ["tagId"],
        },
      ],
    });
    if (!portfolio) {
      throw new NotFoundException(portfoliosMessages.portfolioNotFound);
    }
    return portfolio
  }

  public async deletePortfolioTags(id: string, companyId: string) {
    const portfolio = await Portfolios.findOne({
      where: { id, companyId },
      include: [
        {
          model: PortfoliosTags,
          attributes: ["tagId"],
        },
      ],
    });

    if (!portfolio) {
      throw new NotFoundException(portfoliosMessages.portfolioNotFound);
    }

    try {
      await PortfoliosTags.destroy({
        where: {
          portfolioId: id, // Assuming 'portfolioId' is the foreign key in PortfolioTags
          tagId: portfolio?.porfoliosTags.map((item) => item.tagId)
        },
      });

      return {
        portfolio,
        message: tagMessages.tagDeleted,
      };
    } catch {
      throw new InternalServerErrorException(tagMessages.tagDeleteError);
    }
  }


  public async deletePortfolioById(id: string) {
    const portfolioToDelete = await this.getPortFolioById(id);
    await portfolioToDelete.destroy();
  }

  public async getAllTemplatePortfolios(templatePortfolios: any[]) {
    try {
      const portfolios = await Portfolios.findAll({
        where: {
          id: templatePortfolios.map((portfolio) => portfolio.portfolioId),
        },
      });
      return {
        message: portfoliosMessages.portfolioDeleted,
        portfolios,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        portfoliosMessages.portfolioDeleteError
      );
    }
  }

  public async getAllPortfolios(companyId: string, page: number, searchQuery: string, type: PORTFOLIO_TYPE) {
    const portfoliosPerPage = 20;

    // Calculate offset based on page and pageSize
    const offset = (page - 1) * portfoliosPerPage;

    const options: any = {
      where: { companyId },
      include: [
        {
          model: PortfoliosTags,
          attributes: ["tagId"],
        },
      ],
      offset,
      limit: portfoliosPerPage,
    };

    if (searchQuery) {
      options.where.name = {
        [Op.iLike]: `%${searchQuery}%`, // Case-insensitive search
      };
    }

    if (type) {
      options.where.type = type;
    }
    try {
      let portfolios = await Portfolios.findAll(options);
      let portfoliosCount = await Portfolios.count({
        where: options.where,
      });
      return {
        success: true,
        message: portfoliosMessages.allPortfoliosFetched,
        portfolios,
        portfoliosCount,
        portfoliosPerPage,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        portfoliosMessages.allPortfoliosFetchedError
      );
    }
  }
}
