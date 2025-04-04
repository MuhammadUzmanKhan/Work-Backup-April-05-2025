import { Sequelize } from 'sequelize';
import { Injectable } from '@nestjs/common';
import {
  InventoryType,
  Event,
  Inventory,
  EventInventory,
  Image,
  User,
} from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import {
  AssignedAvailableQueryParamsDto,
  InventoryTypeQueryParamsDto,
} from './dto';
import { getInventoryTypeWhereQuery } from './helpers';

@Injectable()
export class InventoryTypeService {
  /**
   * This query uses EXISTS in a subquery to check if there is an image associated with the InventoryType. The EXISTS operator returns true if the subquery returns any rows, and false otherwise.
   * @returns
   */
  async getAllInventoryTypes(
    user: User,
    inventoryTypeQueryParamsDto: InventoryTypeQueryParamsDto,
  ) {
    const { event_id } = inventoryTypeQueryParamsDto;

    const [company_id] = await withCompanyScope(user, event_id);

    return await InventoryType.findAll({
      where: getInventoryTypeWhereQuery(
        inventoryTypeQueryParamsDto,
        company_id,
      ),
      attributes: [
        'id',
        'name',
        'capacity',
        'color',
        'is_lot',
        'created_at',
        'department_id',
        'inventory_type_category_id',
        [
          Sequelize.literal(`COUNT(DISTINCT "inventories"."id")::INTEGER`),
          'inventories_count',
        ],
        [Sequelize.literal('"inventory_type_image"."url"'), 'image_url'],
        [
          Sequelize.literal(`EXISTS (
            SELECT 1
            FROM "images"
            WHERE "images"."imageable_id" = "InventoryType"."id"
              AND "images"."imageable_type" = 'InventoryType'
          )`),
          'has_image',
        ],
      ],
      include: event_id
        ? [
            {
              model: Event,
              where: {
                id: event_id,
              },
              attributes: [],
            },
            {
              model: Inventory,
              attributes: [],
              include: [
                {
                  model: EventInventory,
                  attributes: [],
                  where: {
                    event_id,
                  },
                },
              ],
            },
            {
              model: Image,
              attributes: [],
            },
          ]
        : [
            {
              model: Inventory,
              attributes: [],
            },
            {
              model: Image,
              attributes: [],
            },
          ],
      group: [
        `"InventoryType"."id"`,
        `"inventory_type_image"."url"`,
        `"events->EventInventoryType"."id"`,
      ],
      order: [['createdAt', SortBy.ASC]],
    });
  }

  async getAvailableAndAssigned(
    user: User,
    assignedAvailableInventoryTypeQueryParamsDto: AssignedAvailableQueryParamsDto,
  ) {
    const { event_id } = assignedAvailableInventoryTypeQueryParamsDto;

    const [company_id] = await withCompanyScope(user, event_id);

    const available = await InventoryType.findAll({
      where: getInventoryTypeWhereQuery(
        assignedAvailableInventoryTypeQueryParamsDto,
        company_id,
      ),
      attributes: [
        'id',
        'name',
        'capacity',
        'color',
        'is_lot',
        'created_at',
        'inventory_type_category_id',
        [
          Sequelize.literal(`COUNT(DISTINCT "inventories"."id")::INTEGER`),
          'inventories_count',
        ],
        [Sequelize.literal('"inventory_type_image"."url"'), 'image_url'],
        [
          Sequelize.literal(`EXISTS (
            SELECT 1
            FROM "images"
            WHERE "images"."imageable_id" = "InventoryType"."id"
              AND "images"."imageable_type" = 'InventoryType'
          )`),
          'has_image',
        ],
      ],
      include: [
        {
          model: Inventory,
          attributes: [],
        },
        {
          model: Image,
          attributes: [],
        },
      ],
      group: [`"InventoryType"."id"`, `"inventory_type_image"."url"`],
      order: [['createdAt', SortBy.ASC]],
    });

    const assigned = await InventoryType.findAll({
      where: getInventoryTypeWhereQuery(
        assignedAvailableInventoryTypeQueryParamsDto,
        company_id,
      ),
      attributes: [
        'id',
        'name',
        'capacity',
        'color',
        'is_lot',
        'created_at',
        'inventory_type_category_id',
        [
          Sequelize.literal(`COUNT(DISTINCT "inventories"."id")::INTEGER`),
          'inventories_count',
        ],
        [Sequelize.literal('"inventory_type_image"."url"'), 'image_url'],
        [
          Sequelize.literal(`EXISTS (
            SELECT 1
            FROM "images"
            WHERE "images"."imageable_id" = "InventoryType"."id"
              AND "images"."imageable_type" = 'InventoryType'
          )`),
          'has_image',
        ],
      ],
      include: [
        {
          model: Event,
          where: {
            id: event_id,
          },
          attributes: [],
        },
        {
          model: Inventory,
          attributes: [],
          include: [
            {
              model: EventInventory,
              attributes: [],
              where: {
                event_id,
              },
            },
          ],
        },
        {
          model: Image,
          attributes: [],
        },
      ],
      group: [
        `"InventoryType"."id"`,
        `"inventory_type_image"."url"`,
        `"events->EventInventoryType"."id"`,
      ],
      order: [['createdAt', SortBy.ASC]],
    });

    return { available, assigned };
  }
}
