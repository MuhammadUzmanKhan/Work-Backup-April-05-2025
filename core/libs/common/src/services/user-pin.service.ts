import { Op } from 'sequelize';
import { MultipleUserPins, PinableType, PolymorphicType } from '../constants';
import { UserPins } from '../models';

export const createUserPin = async (
  pinable_id: number,
  user_id: number,
  pinable_type: PolymorphicType,
  order?: number,
) => {
  return await UserPins.create({
    pinable_id,
    user_id,
    pinable_type,
    order,
  });
};

export const findUserPin = async (
  pinable_id: number,
  user_id: number,
  pinable_type: PolymorphicType,
) => {
  return await UserPins.findOne({
    where: { pinable_id, user_id, pinable_type },
  });
};

export const deleteUserPin = async (
  pinable_id: number,
  user_id: number,
  pinable_type: PolymorphicType,
) => {
  return await UserPins.destroy({
    where: { pinable_id, user_id, pinable_type },
  });
};

export const findUserPins = async (
  user_id: number,
  pinable_type: PinableType,
) => {
  return await UserPins.findAll({
    where: { user_id, pinable_type },
  });
};

export const createUserPinsMultiple = async (
  multipleUserPins: MultipleUserPins[],
) => {
  return await UserPins.bulkCreate(
    multipleUserPins.map(({ pinable_id, user_id, pinable_type, order }) => ({
      pinable_id,
      user_id,
      pinable_type,
      order,
    })),
  );
};

export const deleteUserMultiplePins = async (
  pinable_ids: number[],
  user_id: number,
  pinable_type: PinableType,
) => {
  return await UserPins.destroy({
    where: { pinable_id: { [Op.in]: pinable_ids }, user_id, pinable_type },
  });
};

export const updateUserPinsMultiple = async (
  multipleUserPins: MultipleUserPins[],
) => {
  // Loop through the multipleUserPins and create update objects
  for (const { pinable_id, order, user_id } of multipleUserPins) {
    await UserPins.update(
      { order, pinable_id },
      {
        where: {
          user_id,
          pinable_id,
          pinable_type: PinableType.DASHBOARD_EVENT,
        },
      },
    );
  }
};
