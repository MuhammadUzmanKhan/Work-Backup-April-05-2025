import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import { IndustryDto } from "./dto/industry.dto";
import { Industries } from "src/common/models/industries.model";
import { Op } from "sequelize";
import { Users } from "src/common/models/users.model";
import { industriesMessages } from "src/common/constants/messages";

@Injectable()
export class IndustryService {
  public async createIndustry(
    workspaceId: string,
    { industryDto }: { industryDto: IndustryDto }
  ) {
    let { name, description } = industryDto;

    const industryExists = await Industries.findOne({
      where: {
        name,
        workspaceId
      },
    });
    if (industryExists) {
      throw new ConflictException(industriesMessages.industryExists);
    }
    try {
      const industry = await Industries.create({
        name,
        description,
        workspaceId
      });

      return {
        message: industriesMessages.industryCreated,
        industry,
      };
    } catch (err) {
      console.error(industriesMessages.industryCreateError, err);
      throw new InternalServerErrorException(industriesMessages.industryCreateError);
    }
  }

  public async getIndustries(workspaceId: string) {
    try {
      const industries = await Industries.findAll({ where: { workspaceId } });
      return {
        message: industriesMessages.allIndustriesFetched,
        industries,
      };
    } catch (err) {
      console.error(industriesMessages.allIndustriesFetchedError, err);
      throw new InternalServerErrorException(industriesMessages.allIndustriesFetchedError);
    }
  }

  public async getIndustriesWithPagination(
    { user, page, perPage, search }: { user: Users, page: number, perPage: number, search: string }
  ) {
    try {
      const offset = (page - 1) * perPage;

      let whereQuery: any = {
        workspaceId: user.companyId,
      };

      if (search) {
        whereQuery[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ]
      }

      const industriesCount = await Industries.count({
        where: whereQuery,
      });

      const industries = await Industries.findAll({
        where: whereQuery,
        offset,
        limit: perPage,
      });

      return {
        message: industriesMessages.allIndustriesFetched,
        industries,
        page,
        perPage,
        industriesCount,
      };
    } catch (err) {
      console.error(industriesMessages.allIndustriesFetchedError, err);
      throw new InternalServerErrorException(industriesMessages.allIndustriesFetchedError);
    }
  }

  public async updateIndustry(
    { industryDto, industryId }: { industryId: string, industryDto: IndustryDto }
  ) {
    let { name, description } = industryDto;

    const industry = await Industries.findByPk(industryId)

    if (!industry) {
      throw new NotFoundException(industriesMessages.industryNotFound);
    }

    try {
      if (name) {
        industry.name = name;
      }
      if (description) {
        industry.description = description;
      }

      await industry.save();

      return {
        message: industriesMessages.industryUpdated,
        industry,
      };
    } catch (err) {
      console.error(industriesMessages.industryUpdateError, err);
      throw new InternalServerErrorException(industriesMessages.industryUpdateError);
    }
  }

  public async deleteIndustry(industryId: string) {
    const industry = await Industries.findByPk(industryId);

    if (!industry) {
      throw new NotFoundException(industriesMessages.industryNotFound);
    }

    try {
      await industry.destroy();
      return {
        message: industriesMessages.industryDeleted,
      };
    } catch (err) {
      console.error(industriesMessages.industryDeletedError, err);
      throw new InternalServerErrorException(industriesMessages.industryDeletedError);
    }
  }

}
