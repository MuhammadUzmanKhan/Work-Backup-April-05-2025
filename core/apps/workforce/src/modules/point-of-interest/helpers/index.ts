import { Op, Sequelize } from 'sequelize';
import { Response, Request } from 'express';
import { NotImplementedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  PointOfInterest,
  PointOfInterestType,
} from '@ontrack-tech-group/common/models';
import {
  CsvOrPdf,
  ERRORS,
  Options,
} from '@ontrack-tech-group/common/constants';
import { getReportsFromLambda } from '@ontrack-tech-group/common/services';
import { PointOfInterestQueryParamsDto } from '../dto';

/**
 * @returns It generates a WHERE clause object based on the provided filters for querying Point of Interest.
 */
export const getPointOfInterestWhereQuery = (
  filters: PointOfInterestQueryParamsDto,
) => {
  let _where = {};
  const { event_id, name, type, keyword } = filters;

  _where['event_id'] = event_id;

  if (name) _where['name'] = { [Op.iLike]: `%${name.toLowerCase()}%` };

  if (type)
    _where['$point_of_interest_type.name$'] = {
      [Op.iLike]: `%${type.toLowerCase()}%`,
    };

  if (keyword) {
    _where = {
      [Op.or]: [
        { name: { [Op.iLike]: `%${keyword.toLowerCase()}%` } },
        {
          '$point_of_interest_type.name$': {
            [Op.iLike]: `%${keyword.toLowerCase()}%`,
          },
        },
      ],
    };
  }

  return _where;
};

export const getPointOfInterestById = async (id: number, options?: Options) => {
  return await PointOfInterest.findByPk(id, {
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
    ...options,
  });
};

export const generateCsvOrPdfForPointOfInterest = async (
  params: PointOfInterestQueryParamsDto,
  pointOfInterests: PointOfInterest[],
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  if (params.csv_pdf === CsvOrPdf.CSV) {
    // Formatting data for csv
    const formattedPointOfInterestDataForCsv =
      getFormattedPointOfInterestDataForCsv(pointOfInterests);

    // Api call to lambda for getting csv
    const response: any = await getReportsFromLambda(
      req.headers.authorization,
      httpService,
      formattedPointOfInterestDataForCsv,
      CsvOrPdf.CSV,
    );

    // Setting Headers for csv and sending csv in response
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="poi.csv"');
    return res.send(response.data);
  } else if (params.csv_pdf === CsvOrPdf.PDF) {
    throw new NotImplementedException(
      ERRORS.REQUIRED_RESOURCE_IS_UNDER_DEVELOPMENT,
    );
  }
};

/**
 * The data showing in listing needs to be download in csv as well.
 * @param pointOfInterests
 * @returns Formatted object for CSV file for pointOfInterests.
 */
export const getFormattedPointOfInterestDataForCsv = (
  pointOfInterests: PointOfInterest[],
) => {
  return pointOfInterests.map((pointOfInterest: PointOfInterest) => {
    return {
      'POI Name': pointOfInterest.name || '--',
      'POI Type': pointOfInterest['type'] || '--',
      Status: pointOfInterest.active ? 'Active' : 'Inactive',
    };
  });
};
