import { Op } from 'sequelize';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Source } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  PusherChannels,
  PusherEvents,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { _ERRORS } from '@Common/constants';
import { SourceQueryParamsDto } from '../dto/source-query.dto';

export const getSourceWhereQuery = (
  filters: SourceQueryParamsDto,
  company_id: number,
) => {
  const _where = {};
  const { keyword } = filters;

  _where['company_id'] = company_id;

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword}%` };
  }

  return _where;
};

export const isSourceExist = async (id: number) => {
  const source = await Source.findOne({
    where: { id },
    attributes: ['id', 'name', 'is_test', 'company_id'],
  });
  if (!source) throw new NotFoundException(ERRORS.SOURCE_NOT_FOUND);

  return source;
};

export const isSourcesExist = async (
  source_ids: number[],
  company_id: number,
) => {
  if (source_ids.length) {
    const sources = await Source.count({
      where: {
        company_id,
        id: { [Op.in]: source_ids },
      },
    });
    if (source_ids.length !== sources)
      throw new NotFoundException(
        source_ids.length > 1
          ? _ERRORS.SOME_OF_SOURCE_ARE_NOT_FOUND
          : _ERRORS.SOURCE_NOT_FOUND,
      );
  } else {
    throw new BadRequestException(_ERRORS.SOURCE_ID_LIST_IS_EMPTY);
  }
};

export const getFilteredSourcesForCsv = async (
  parsedFileData: { name: string }[],
  company_id: number,
) => {
  const uniqueFileData = Array.from(
    new Set(parsedFileData.map((item) => item?.name.toLowerCase())),
  ).map((name) =>
    parsedFileData.find((item) => item.name.toLowerCase() === name),
  );

  const alreadyCreatedSources = (
    await Source.findAll({
      where: {
        name: {
          [Op.iLike]: {
            [Op.any]: uniqueFileData.map((item) => item.name.toLowerCase()),
          },
        },
        company_id,
      },
      attributes: ['name'],
    })
  ).map((source) => source.name.toLowerCase());

  return uniqueFileData.filter(
    (source) => !alreadyCreatedSources.includes(source.name.toLowerCase()),
  );
};

export function sendUpdatedSource(
  data,
  event_id: number,
  status: string,
  type: string,
  newEntry: boolean,
  pusherService: PusherService,
) {
  pusherService.sendDataUpdates(
    `${PusherChannels.INCIDENT_CHANNEL}-${event_id}`,
    [PusherEvents.INCIDENT_SETUP],
    {
      ...data,
      status,
      type,
      newEntry,
    },
  );
}
