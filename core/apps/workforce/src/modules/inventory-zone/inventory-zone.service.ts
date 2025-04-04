import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize';
import {
  Image,
  InventoryZone,
  ReservationType,
} from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { InventoryZoneQueryParamsDto } from './dto';
import { getInventoryZoneWhereQuery } from './helpers';

@Injectable()
export class InventoryZoneService {
  public async getAllInventoryZones(
    inventoryZoneQueryParamsDto: InventoryZoneQueryParamsDto,
  ) {
    const { has_image_or_comment } = inventoryZoneQueryParamsDto;

    const inventoryZones = await InventoryZone.findAll({
      where: getInventoryZoneWhereQuery(inventoryZoneQueryParamsDto),
      attributes: [
        'id',
        'name',
        'latitude',
        'longitude',
        'color',
        'sequence',
        'event_id',
        [
          Sequelize.literal(`EXISTS (
            SELECT 1
            FROM "images"
            WHERE "images"."imageable_id" = "InventoryZone"."id"
              AND "images"."imageable_type" = 'InventoryZone'
          )`),
          'has_image',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)::INTEGER FROM "inventory_inventory_zones" 
            WHERE "inventory_inventory_zones"."inventory_zone_id" = "InventoryZone"."id"
          )`),
          'linked_inventories_count',
        ],
        [
          Sequelize.literal('"reservation_types"."name"'),
          'reservation_type_name',
        ],
      ],
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: ReservationType,
          attributes: ['id', 'name', 'event_id'],
          through: { attributes: [] }, // Exclude the join table (InventoryZoneReservationType) from the query result
        },
      ],
      group: [
        `"InventoryZone"."id"`,
        `"reservation_types"."name"`,
        `"reservation_types"."id"`,
      ],
      having: has_image_or_comment
        ? Sequelize.literal(`EXISTS (
            SELECT 1 FROM "images" 
            WHERE "images"."imageable_id" = "InventoryZone"."id" AND "images"."imageable_type" = 'InventoryZone'
          )`)
        : {},
      order: [['id', SortBy.ASC]],
    });

    return inventoryZones;
  }
}
