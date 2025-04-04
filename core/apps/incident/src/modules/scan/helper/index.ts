import { Op, Sequelize } from 'sequelize';
import { Location, Scan } from '@ontrack-tech-group/common/models';
import { Options, PolymorphicType } from '@ontrack-tech-group/common/constants';
import {
  CreateScanByStaffAndEventIdDto,
  GetScanByStaffAndEventIdDto,
} from '../dto';

export const createUpdateLocation = async (
  createScanDto: CreateScanByStaffAndEventIdDto,
  scan: Scan,
) => {
  const { latitude, longitude, event_id, distance, eta, speed, battery_level } =
    createScanDto;

  if (latitude === undefined || longitude === undefined) return;

  if (scan.inventory_id && !scan.parent_id) {
    await Location.create({
      event_id,
      latitude,
      longitude,
      locationable_id: scan.inventory_id,
      locationable_type: PolymorphicType.INVENTORY,
    });
  } else if (scan.reservation_id) {
    const updatedLocation = await Location.update(
      {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
      {
        where: {
          locationable_id: scan.id,
          locationable_type: PolymorphicType.SCAN,
        },
      },
    );

    if (!updatedLocation) {
      await Location.create({
        latitude,
        longitude,
        locationable_id: scan.id,
        locationable_type: PolymorphicType.SCAN,
      });
    }
  } else if (scan.user_id) {
    await Location.create({
      latitude,
      longitude,
      locationable_id: scan.user_id,
      locationable_type: PolymorphicType.USER,
      distance,
      eta,
      speed,
      battery_level,
    });
  }
};

export const getBasicAttributesOfScan = [
  'id',
  'scanner_id',
  'user_id',
  'event_id',
  'created_at',
  'enabled',
];

export const getScanByStaffIdWhere = (
  getScanByStaffAndEventIdDto: GetScanByStaffAndEventIdDto,
) => {
  const { event_id, user_id, keyword } = getScanByStaffAndEventIdDto;
  const _where = { event_id, user_id };

  if (keyword) {
    _where[Op.or] = [
      Scan.searchFormattedScanTypeByKey(keyword),
      Sequelize.literal(`CAST("Scan"."id" AS TEXT) ILIKE '%${keyword}%'`),
    ];
  }

  return _where;
};

export const getCreatedOrUpdatedScan = async (
  id: number,
  options?: Options,
) => {
  return await Scan.findByPk(id, {
    attributes: [
      ...getBasicAttributesOfScan,
      [Scan.getFormattedScanTypeByKey, 'scan_type'],
      'inventory_id',
      'reservation_id',
      'parent_id',
    ],
    ...options,
  });
};
