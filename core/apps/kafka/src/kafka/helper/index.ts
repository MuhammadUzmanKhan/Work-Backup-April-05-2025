import { NotFoundException } from '@nestjs/common';
import { User, Event, Location } from '@ontrack-tech-group/common/models';
import {
  LocationRecord,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import { Sequelize } from 'sequelize-typescript';

export const checkUserAgainstEvent = async (
  user_id: number,
  event_id: number,
) => {
  const _user = await User.findOne({
    where: { id: user_id },
    attributes: ['id'],
    include: [
      {
        model: Event,
        where: { id: event_id },
        attributes: ['id'],
        as: 'events',
        required: true,
        through: { attributes: [] },
      },
    ],
  });
  if (!_user)
    throw new NotFoundException(
      RESPONSES.notFound('User') + ' for the Event Id passed',
    );

  return _user;
};

export const upsertUserLocation = async (
  totalRecords: LocationRecord[],
  sequelize: Sequelize,
) => {
  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const upsertPromises = totalRecords.map((record) =>
      Location.upsert<Location>(record, {
        transaction, // Pass the transaction object
        conflictFields: ['locationable_id', 'locationable_type', 'event_id'],
      }),
    );

    await Promise.all(upsertPromises);

    await transaction.commit(); // Commit the transaction
    return true;
  } catch (error) {
    console.error('Error upserting records:', error);
    if (transaction) await transaction.rollback(); // Rollback the transaction on error
  }

  return false;
};
