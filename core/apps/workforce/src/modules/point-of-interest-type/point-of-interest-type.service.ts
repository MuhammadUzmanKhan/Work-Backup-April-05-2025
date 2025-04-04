import { Op } from 'sequelize';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PointOfInterestType } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
} from '@ontrack-tech-group/common/helpers';
import {
  CreatePointOfInterestTypeDto,
  PointOfInterestTypeQueryParamsDto,
  UpdatePointOfInterestTypeDto,
} from './dto';
import {
  getPointOfInterestTypeById,
  getPointOfInterestTypeWhereQuery,
} from './helpers';

@Injectable()
export class PointOfInterestTypeService {
  async createPointOfInterestType(
    createPointOfInterestTypeDto: CreatePointOfInterestTypeDto,
  ) {
    // name can't be duplicate of Point of Interest Types
    const isAlreadyExist = await PointOfInterestType.findOne({
      where: {
        name: {
          [Op.iLike]: createPointOfInterestTypeDto.name.toLowerCase().trim(),
        },
      },
    });
    if (isAlreadyExist)
      throw new ConflictException(
        RESPONSES.alreadyExist('Point Of Interest Type'),
      );

    const createdPointOfInterestType = await PointOfInterestType.create({
      ...createPointOfInterestTypeDto,
    });

    return await getPointOfInterestTypeById(createdPointOfInterestType.id, {
      useMaster: true,
    });
  }

  async getAllPointOfInterestTypes(
    pointOfInterestTypeQueryParamsDto: PointOfInterestTypeQueryParamsDto,
  ) {
    const { page, page_size, sort_column, order, keyword } =
      pointOfInterestTypeQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const pointOfInterestTypes = await PointOfInterestType.findAndCountAll({
      where: getPointOfInterestTypeWhereQuery(keyword),
      attributes: ['id', 'name', 'color'],
      order: [[sort_column || 'name', order || SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = pointOfInterestTypes;

    return {
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async updatePointOfInterestType(
    id: number,
    updatePointOfInterestDto: UpdatePointOfInterestTypeDto,
  ) {
    const pointOfInterestType = await PointOfInterestType.findByPk(id, {
      attributes: ['id'],
    });
    if (!pointOfInterestType)
      throw new NotFoundException(RESPONSES.notFound('Point Of Interest Type'));

    const updatedPointOfInterestType = await pointOfInterestType.update({
      ...updatePointOfInterestDto,
    });
    if (!updatedPointOfInterestType)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    return await getPointOfInterestTypeById(updatedPointOfInterestType.id, {
      useMaster: true,
    });
  }

  async deletePointOfInterestType(id: number) {
    const pointOfInterestType = await PointOfInterestType.findByPk(id, {
      attributes: ['id'],
    });
    if (!pointOfInterestType)
      throw new NotFoundException(RESPONSES.notFound('Point Of Interest Type'));

    await pointOfInterestType.destroy();

    return {
      message: RESPONSES.destroyedSuccessfully('Point Of Interest Type'),
    };
  }
}
