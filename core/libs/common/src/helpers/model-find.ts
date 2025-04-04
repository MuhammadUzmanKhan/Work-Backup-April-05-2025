import { Model, Op, FindOptions, Sequelize } from 'sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FindOptionsInterface, RESPONSES } from '../constants';

/**
 *
 * @param model Any Model
 * @param message Model or message part for example, Source, Incident Type, etc
 * @param name Name to find
 * @param company_id optional company id to add as filter
 * @param event_id optional event id to add as filter
 * @param id to check if name is already exist other than the current item
 */
export const checkIfNameAlreadyExistModel = async <T extends Model>(
  model: { new (): T } & typeof Model,
  message: string,
  name: string,
  company_id?: number,
  event_id?: number,
  id?: number,
) => {
  const where = {};

  if (id)
    where['id'] = {
      [Op.ne]: id,
    };

  if (name)
    where['name'] = {
      [Op.iLike]: name.toLowerCase().trim(),
    };

  if (company_id) where['company_id'] = company_id;

  if (event_id) where['event_id'] = event_id;

  // Find existing item in the database
  const findOptions: FindOptions<FindOptionsInterface> = {
    where,
    attributes: ['id'],
  };

  const item = await model.findOne(findOptions);

  if (item) throw new ConflictException(RESPONSES.alreadyExist(message));
};

/**
 *
 * @param model Any Model
 * @param message Model or message part for example, Source, Incident Type, etc
 * @param ids List of ids to check
 * @param company_id optional company id to add as filter
 * @param event_id optional event id to add as filter
 */
export const checkIfAllIdsExist = async <T extends Model>(
  model: { new (): T } & typeof Model,
  message: string,
  ids: number[],
  company_id?: number,
  event_id?: number,
) => {
  const where = {};

  if (ids?.length) {
    where['id'] = {
      [Op.in]: ids,
    };
  } else return;

  if (company_id) where['company_id'] = company_id;

  if (event_id) where['event_id'] = event_id;

  // Find existing item in the database
  const findOptions: FindOptions<FindOptionsInterface> = {
    where,
  };

  const itemCount = await model.count(findOptions);

  if (itemCount !== ids?.length)
    throw new NotFoundException(RESPONSES.notFound(message));
};

/**
 *
 * @param model Any Model
 * @param message Model or message part for example, Source, Incident Type, etc
 * @param ids List of ids to check
 * @param company_id optional company id to add as filter
 * @param event_id optional event id to add as filter
 */
export const checkIfAllIdsExistWithObject = async <T extends Model>(
  model: { new (): T } & typeof Model,
  message: string,
  ids: number[],
  company_id?: number,
  event_id?: number,
) => {
  const where = {};

  if (ids?.length) {
    where['id'] = {
      [Op.in]: ids,
    };
  } else return;

  if (company_id) where['company_id'] = company_id;

  if (event_id) where['event_id'] = event_id;

  // Find existing item in the database
  const findOptions: FindOptions<FindOptionsInterface> = {
    where,
    attributes: [
      [Sequelize.cast(Sequelize.col('id'), 'integer'), 'id'],
      'name',
    ],
  };

  const items = await model.findAll(findOptions);

  if (items.length !== ids?.length)
    throw new NotFoundException(RESPONSES.notFound(message));

  return items;
};

/**
 *
 * @param model Any Model
 * @param whereCondition Where condition includes all the conditions to be checked
 * @param attributes attributes includes all the attributes to be fetched
 */
export const checkIfRecordsExist = async <T extends Model>(
  model: { new (): T } & typeof Model,
  whereCondition?: object,
  attributes?: string[],
) => {
  const where = { ...whereCondition };

  // Find existing items in the database
  const findOptions: FindOptions<FindOptionsInterface> = {
    where,
    ...(attributes.length && { attributes }),
    raw: true,
  };

  const items = await model.findAll(findOptions);

  if (items.length) return items;
  return false;
};

/**
 *
 * @param model Any Model
 * @param whereCondition Where condition includes all the conditions to be checked
 * @param attributes attributes includes all the attributes to be fetched
 */
export const checkIfSingleRecordExist = async <T extends Model>(
  model: { new (): T } & typeof Model,
  whereCondition?: object,
  attributes?: string[],
) => {
  const where = { ...whereCondition };

  // Find existing item in the database
  const findOptions: FindOptions<FindOptionsInterface> = {
    where,
    ...(attributes.length && { attributes }),
    raw: true,
  };

  const item = await model.findOne(findOptions);

  if (item) return item;
  return false;
};
