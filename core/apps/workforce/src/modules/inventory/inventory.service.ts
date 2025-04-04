import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import {
  ERRORS,
  Options,
  PolymorphicType,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  Department,
  EventInventory,
  Image,
  Inventory,
  InventoryType,
  Scan,
  User,
  UserInventory,
  InventoryZone,
  Location,
  Reservation,
  Comment,
  InventoryDamage,
  Damage,
} from '@ontrack-tech-group/common/models';
import { Op } from 'sequelize';
import {
  AssociateUserWithInventoryDto,
  GetInventoryByTypeDto,
  GetInventoryDto,
  GetInventoryTypeDto,
  InventoryByStatsDto,
  UpdateInventoryDto,
  UploadImagesForInventory,
} from './dto';
import { MESSAGES } from '@ontrack-tech-group/common/constants';
import {
  associateUserOrReservation,
  disassociateUserOrReservation,
  getInventoryWhereQuery,
  getInventoryByIdHelper,
  inventoryByStatHelper,
  inventoryByStatScanHelper,
} from './helpers';
import { isInventoryExists } from '@Common/helpers';

@Injectable()
export class InventoryService {
  constructor(private sequelize: Sequelize) {}

  async associateUserToInventory(
    associateUserWithInventory: AssociateUserWithInventoryDto,
  ) {
    const transaction = await this.sequelize.transaction();
    const { event_id, inventory_id, user_id } = associateUserWithInventory;

    const inventory = await Inventory.findOne({
      where: { id: inventory_id },
      attributes: [
        'id',
        'name',
        'createdAt',
        [Sequelize.literal('"inventory_type"."name"'), 'inventory_type_name'],
      ],
      include: [
        {
          model: EventInventory,
          where: { event_id },
          attributes: ['id'],
        },
        {
          model: InventoryType,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
    });

    if (!inventory)
      throw new NotFoundException(
        ERRORS.WE_COULD_NOT_FIND_INVENTORY_FOR_PASSED_INVENTORY_ID,
      );

    try {
      await associateUserOrReservation(
        associateUserWithInventory,
        inventory,
        transaction,
      );

      const userInventory = await UserInventory.findOrCreate({
        where: { user_id, inventory_id },
        defaults: {
          user_id,
          inventory_id,
        },
        transaction,
      });

      if (!userInventory[1]) {
        await transaction.rollback();
        return {
          message: 'ASSOCIATION ALREADY EXISTS',
        };
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
    }
    return {
      message: MESSAGES.INVENTORY_ASSOCIATED_SUCCESSFULLY,
      inventory_detail: { inventory_id },
    };
  }

  async disassociateUserToInventory(
    disassociateUserWithInventory: AssociateUserWithInventoryDto,
  ) {
    const transaction = await this.sequelize.transaction();
    const { event_id, inventory_id, user_id } = disassociateUserWithInventory;

    const inventory = await Inventory.findOne({
      where: { id: inventory_id },
      attributes: [
        'id',
        'name',
        'createdAt',
        [Sequelize.literal('"inventory_type"."name"'), 'inventory_type_name'],
      ],
      include: [
        {
          model: EventInventory,
          where: { event_id },
          attributes: ['id'],
        },
        {
          model: InventoryType,
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
    });

    if (!inventory)
      throw new NotFoundException(
        ERRORS.WE_COULD_NOT_FIND_INVENTORY_FOR_PASSED_INVENTORY_ID,
      );

    const user_inventory = await UserInventory.findOne({
      where: { user_id, inventory_id },
    });

    if (!user_inventory)
      throw new NotFoundException(
        ERRORS.WE_COULD_NOT_FIND_INVENTORY_FOR_PASSED_INVENTORY_ID,
      );

    try {
      await disassociateUserOrReservation(
        disassociateUserWithInventory,
        transaction,
      );

      await user_inventory.destroy();

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
    }
    return {
      message: MESSAGES.INVENTORY_DISASSOCIATED_SUCCESSFULLY,
      inventory_detail: { inventory_id },
    };
  }

  async uploadImage(
    uploadImagesForInventory: UploadImagesForInventory,
    user: User,
  ) {
    const { images, id, event_id } = uploadImagesForInventory;

    await isInventoryExists(id);

    images?.length &&
      (await Promise.all(
        images.map(
          async (image) =>
            await Image.create({
              url: image,
              imageable_id: id,
              imageable_type: PolymorphicType.INVENTORY,
              creator_id: user.id,
              event_id,
            }),
        ),
      ));

    return this.getInventoryById(id, event_id, null, { useMaster: true });
  }

  async getAllInventory(params: GetInventoryDto) {
    const { event_id, staff_id, keyword, inventory_type_id, last_scan_type } =
      params;
    const [page, page_size] = getPageAndPageSize(params.page, params.page_size);

    const inventeries = await Inventory.findAndCountAll({
      where: getInventoryWhereQuery(keyword, event_id),
      attributes: [
        'id',
        'created_at',
        [Sequelize.literal('"department"."name"'), 'department_name'],
        [Sequelize.literal('"department"."id"'), 'department_id'],
        [Sequelize.literal('"inventory_type"."name"'), 'inventory_type_name'],
      ],
      include: [
        {
          model: Department,
          attributes: [],
          required: false,
        },
        {
          model: InventoryType,
          attributes: [],
          where: inventory_type_id ? { id: inventory_type_id } : {},
          required: !!inventory_type_id,
        },
        {
          model: UserInventory,
          where: staff_id ? { user_id: staff_id } : {},
          attributes: [],
          required: false,
        },
        {
          model: EventInventory,
          attributes: [],
        },
      ],
      distinct: true,
      subQuery: false,
      limit: page_size || undefined,
      offset: page_size * page || undefined,
      order: [[params.sort_column || 'createdAt', params.order || SortBy.DESC]],
    });

    const { rows, count } = inventeries;

    const inventoryIds = rows.map((data) => data.id);

    const staffInventeries = await Inventory.findAll({
      where: getInventoryWhereQuery(keyword, event_id, inventoryIds),
      attributes: {
        include: [
          [Sequelize.literal('"department"."name"'), 'department_name'],
          [Sequelize.literal('"department"."id"'), 'department_id'],
          [Sequelize.literal('"inventory_type"."name"'), 'inventory_type_name'],
          [Sequelize.literal('"event_inventories"."last_scan"'), 'last_scan'],
          [
            Sequelize.literal('"inventory_type"."inventory_type_category_id"'),
            'inventory_type_category_id',
          ],
        ],
        exclude: ['last_scan'],
      },
      include: [
        {
          model: Department,
          attributes: [],
          required: false,
        },
        {
          model: Image,
          as: 'images',
          attributes: [
            'id',
            'name',
            'url',
            'createdAt',
            'thumbnail',
            [Sequelize.literal(`"images->created_by"."name"`), 'createdBy'],
          ],
          include: [
            {
              model: User,
              as: 'created_by',
              attributes: [],
            },
          ],
        },
        {
          model: InventoryType,
          attributes: ['id', 'name'],
          where: inventory_type_id ? { id: inventory_type_id } : {},
          required: !!inventory_type_id,
        },
        {
          model: UserInventory,
          where: staff_id ? { user_id: staff_id } : {},
          attributes: [],
          required: false,
        },
        {
          model: EventInventory,
          where: {
            event_id,
            ...(last_scan_type
              ? {
                  [Op.and]: Sequelize.literal(
                    `"event_inventories"."last_scan"->>'scan_type'  = '${last_scan_type}'`,
                  ),
                }
              : {}),
          },
          attributes: [],
        },
        {
          model: Location,
          attributes: ['latitude', 'longitude'],
        },
      ],
      subQuery: false,
      order: [[params.sort_column || 'createdAt', params.order || SortBy.DESC]],
    });

    return {
      data: staffInventeries,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async getInventoryType(getInventoryTypeDto: GetInventoryTypeDto, user: User) {
    const { event_id, inventory_type_category_id } = getInventoryTypeDto;

    await withCompanyScope(user, event_id);

    return await Inventory.findAll({
      attributes: [
        [Sequelize.literal('"inventory_type"."name"'), 'name'],
        [Sequelize.literal('"inventory_type"."id"'), 'id'],
      ],
      include: [
        {
          model: InventoryType,
          attributes: [],
          where: { inventory_type_category_id },
        },
        {
          model: EventInventory,
          attributes: [],
          where: { event_id },
        },
      ],
    });
  }

  async getInventoryByStat(inventoryByStatsDto: InventoryByStatsDto) {
    const { inventory_type_id, type, event_id } = inventoryByStatsDto;

    const inventoryByStats = await Inventory.findAll({
      where: inventoryByStatHelper(inventoryByStatsDto),
      include: [
        {
          model: Scan,
          where: inventoryByStatScanHelper(type, event_id),
          attributes: [
            'id',
            [Scan.getFormattedScanTypeByKeyForUsers, 'scan_type'],
          ],
        },
        {
          model: InventoryType,
          attributes: ['id', 'name'],
          where: inventory_type_id ? { id: inventory_type_id } : {},
          required: !!inventory_type_id,
        },
      ],
    });

    return inventoryByStats;
  }

  async getInventoriesByInventoryType(params: GetInventoryByTypeDto) {
    const { event_id, inventory_type_id } = params;
    const [page, page_size] = getPageAndPageSize(params.page, params.page_size);

    const inventories = await Inventory.findAndCountAll({
      where: { inventory_type_id },
      attributes: ['id', 'name', 'unique_code', 'inventory_type_id', 'enabled'],
      include: [
        {
          model: EventInventory,
          where: { event_id },
          attributes: [],
        },
      ],
      limit: page_size || undefined,
      offset: page_size * page || undefined,
    });

    const { rows, count } = inventories;

    return {
      data: rows,
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async getInventoryById(
    id: number,
    event_id: number,
    user?: User,
    options?: Options,
  ) {
    if (user) await withCompanyScope(user, event_id);

    const inventeries = await Inventory.findOne({
      where: getInventoryByIdHelper(event_id, id),
      attributes: {
        include: [
          [Sequelize.literal('"department"."name"'), 'department_name'],
          [Sequelize.literal('"department"."id"'), 'department_id'],
          [Sequelize.literal('"inventory_type"."name"'), 'inventory_type_name'],
          [Sequelize.literal('"event_inventories"."last_scan"'), 'last_scan'],
          [
            Sequelize.literal(
              `(SELECT "name" FROM "inventory_zones" WHERE "inventory_zones"."id" = "Inventory"."inventory_zone_id")`,
            ),
            'inventory_zone_name',
          ],
        ],
        exclude: ['last_scan'],
      },
      include: [
        {
          model: Department,
          attributes: [],
          required: false,
        },
        {
          model: Image,
          as: 'images',
          attributes: [
            'id',
            'name',
            'url',
            'createdAt',
            'thumbnail',
            [Sequelize.literal(`"images->created_by"."name"`), 'createdBy'],
          ],
          include: [
            {
              model: User,
              as: 'created_by',
              attributes: [],
            },
          ],
        },
        {
          model: InventoryType,
          attributes: ['id', 'name'],
          required: false,
        },
        {
          model: UserInventory,
          attributes: [],
          required: false,
        },
        {
          model: EventInventory,
          attributes: [],
        },
        {
          model: Scan,
          where: { event_id },
          required: false,
          attributes: {
            include: [[Scan.getFormattedScanTypeByKeyForUsers, 'scan_type']],
          },
          include: [
            {
              model: Location,
            },
          ],
        },
        {
          model: Location,
          attributes: ['latitude', 'longitude'],
        },
        {
          model: Reservation,
        },
        {
          model: Comment,
        },
        {
          model: InventoryDamage,
          include: [
            {
              model: Damage,
            },
          ],
        },
      ],
      subQuery: false,
      ...options,
    });

    if (!inventeries)
      throw new NotFoundException(RESPONSES.notFound('Inventory'));

    return inventeries;
  }

  async updateInventory(id: number, updateInventoryDto: UpdateInventoryDto) {
    const { inventory_type_id, inventory_zone_id } = updateInventoryDto;

    const inventory = await Inventory.findOne({
      where: { id },
    });
    if (!inventory)
      throw new NotFoundException(RESPONSES.notFound('Inventory'));

    if (inventory_zone_id) {
      const inventoryZone = await InventoryZone.findByPk(inventory_zone_id, {
        attributes: ['id'],
      });

      if (!inventoryZone)
        throw new NotFoundException(RESPONSES.notFound('Inventory Zone'));
    }

    if (inventory_type_id) {
      const inventoryType = await InventoryType.findByPk(inventory_type_id, {
        attributes: ['id'],
      });

      if (!inventoryType)
        throw new NotFoundException(RESPONSES.notFound('Inventory Type'));
    }

    await inventory.update({ ...updateInventoryDto });

    return inventory;
  }

  async updateInventoryStatus(id: number) {
    const inventory = await Inventory.findByPk(id, {
      attributes: ['id', 'enabled'],
    });
    if (!inventory)
      throw new NotFoundException(
        ERRORS.WE_COULD_NOT_FIND_INVENTORY_FOR_PASSED_INVENTORY_ID,
      );

    await inventory.update({ enabled: !inventory.enabled });

    return inventory;
  }
}
