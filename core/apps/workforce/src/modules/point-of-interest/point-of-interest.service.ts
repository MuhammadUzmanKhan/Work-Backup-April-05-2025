import { Sequelize } from 'sequelize';
import { Response, Request } from 'express';
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  PointOfInterest,
  PointOfInterestType,
} from '@ontrack-tech-group/common/models';
import {
  calculatePagination,
  getPageAndPageSize,
  successInterceptorResponseFormat,
} from '@ontrack-tech-group/common/helpers';
import {
  SortBy,
  ERRORS,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import { getPointOfInterestTypeById } from '@Modules/point-of-interest-type/helpers';
import {
  CreatePointOfInterestDto,
  PointOfInterestQueryParamsDto,
  UpdatePointOfInterestDto,
} from './dto';
import {
  generateCsvOrPdfForPointOfInterest,
  getPointOfInterestById,
  getPointOfInterestWhereQuery,
} from './helpers';

@Injectable()
export class PointOfInterestService {
  constructor(private readonly httpService: HttpService) {}

  async createPointOfInterest(
    createPointOfInterestDto: CreatePointOfInterestDto,
  ) {
    const { poi_type_id } = createPointOfInterestDto;

    const pointOfInterestType = await getPointOfInterestTypeById(poi_type_id);
    if (!pointOfInterestType)
      throw new NotFoundException(RESPONSES.notFound('Point Of Interest Type'));

    const createdPointOfInterest = await PointOfInterest.create({
      ...createPointOfInterestDto,
    });

    return await getPointOfInterestById(createdPointOfInterest.id, {
      useMaster: true,
    });
  }

  async getAllPointOfInterests(
    pointOfInterestQueryParamsDto: PointOfInterestQueryParamsDto,
    res: Response,
    req: Request,
  ) {
    const { page, page_size, sort_column, order, csv_pdf } =
      pointOfInterestQueryParamsDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    const pointOfInterests = await PointOfInterest.findAndCountAll({
      where: getPointOfInterestWhereQuery(pointOfInterestQueryParamsDto),
      attributes: {
        include: [
          [Sequelize.literal(`"point_of_interest_type"."name"`), 'type'],
          [Sequelize.literal(`"point_of_interest_type"."color"`), 'color'],
          [
            Sequelize.literal(`(
              SELECT COUNT("point_of_interests"."poi_type_id")::INTEGER FROM "point_of_interests"
              WHERE "point_of_interests"."poi_type_id" = "PointOfInterest"."poi_type_id"
            )`),
            'type_count',
          ],
        ],
      },
      include: [
        {
          model: PointOfInterestType,
          attributes: [],
        },
      ],
      order: [[sort_column || 'name', order || SortBy.ASC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      raw: true,
    });

    const { rows, count } = pointOfInterests;

    if (csv_pdf) {
      return await generateCsvOrPdfForPointOfInterest(
        pointOfInterestQueryParamsDto,
        rows,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(
      successInterceptorResponseFormat({
        data: rows,
        pagination: calculatePagination(count, _page_size, _page),
      }),
    );
  }

  async updatePointOfInterest(
    id: number,
    updatePointOfInterestDto: UpdatePointOfInterestDto,
  ) {
    const { event_id } = updatePointOfInterestDto;

    const pointOfInterest = await PointOfInterest.findOne({
      where: { id, event_id },
      attributes: ['id'],
    });
    if (!pointOfInterest)
      throw new NotFoundException(RESPONSES.notFound('Point of Interest'));

    const updatedPointOfInterest = await pointOfInterest.update({
      ...updatePointOfInterestDto,
    });
    if (!updatedPointOfInterest)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    return await getPointOfInterestById(updatedPointOfInterest.id, {
      useMaster: true,
    });
  }

  async deletePointOfInterest(id: number, event_id: number) {
    const pointOfInterest = await PointOfInterest.findOne({
      where: { id, event_id },
      attributes: ['id'],
    });
    if (!pointOfInterest)
      throw new NotFoundException(RESPONSES.notFound('Point of Interest'));

    await pointOfInterest.destroy();

    return { message: RESPONSES.destroyedSuccessfully('Point of Interest') };
  }
}
