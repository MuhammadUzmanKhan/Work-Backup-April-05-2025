import { Assignment, Inventory, Scan } from '@ontrack-tech-group/common/models';
import { Op, Sequelize } from 'sequelize';
import { AssociateUserWithInventoryDto } from './dto/associate-user-with-inventory.dto';
import { SCANS, SCAN_TYPE } from '@Common/constants';
import { InventoryByStatsDto } from './dto';

export const associateUserOrReservation = async (
  associateUserWithInventory: AssociateUserWithInventoryDto,
  inventory: Inventory,
  transaction,
) => {
  const { event_id, department_id, inventory_id, user_id } =
    associateUserWithInventory;
  const inventoryType = inventory.name;

  await Assignment.findOrCreate({
    where: { event_id, inventory_id },
    defaults: {
      user_id,
      event_id,
      department_id: department_id || null,
      inventory_id,
    },
    transaction,
  });

  await Scan.create({
    inventory_id,
    event_id,
    scan_type: 2,
    scanner_id: user_id,
    inventory_type: inventoryType,
    transaction,
  });

  return true;
};

export const disassociateUserOrReservation = async (
  disassociateUserWithInventory: AssociateUserWithInventoryDto,
  transaction,
) => {
  const { event_id, department_id, inventory_id, user_id } =
    disassociateUserWithInventory;

  await Assignment.destroy({
    where: { event_id, inventory_id, user_id, department_id },
    transaction,
  });

  await Scan.destroy({
    where: {
      inventory_id,
      event_id,
      scanner_id: user_id,
    },
    transaction,
  });

  return true;
};

export const getInventoryWhereQuery = (
  keyword: string,
  event_id: number,
  inventeryIds?: number[],
) => {
  const _where = {};

  if (inventeryIds?.length) {
    _where['id'] = { [Op.in]: inventeryIds };
  }

  _where['events_id'] = Sequelize.literal(`'${event_id}' = ANY("events_id")`);

  if (keyword) {
    _where[Op.or] = [
      Sequelize.literal(
        `"department"."name" ILIKE'%${keyword.toLowerCase()}%'`,
      ),
      Sequelize.literal(`"Inventory"."name" ILIKE'%${keyword.toLowerCase()}%'`),
      Sequelize.literal(
        `"inventory_type"."name" ILIKE'%${keyword.toLowerCase()}%'`,
      ),
    ];
  }

  return _where;
};

export const inventoryByStatScanHelper = (type: SCANS, event_id: number) => {
  const _where = {};

  _where['scan_type'] = SCAN_TYPE[type.toUpperCase()];

  _where['last_scan'] = true;

  if (event_id) {
    _where['event_id'] = event_id;
  }

  return _where;
};

export const inventoryByStatHelper = (
  inventoryByStatsDto: InventoryByStatsDto,
) => {
  const { event_id, department_id } = inventoryByStatsDto;
  const _where = {};

  if (event_id) {
    _where['events_id'] = Sequelize.literal(`'${event_id}' = ANY("events_id")`);
  }

  if (department_id) {
    _where['department_id'] = {
      [Op.eq]: department_id,
    };
  }

  return _where;
};

export const getInventoryByIdHelper = (event_id: number, id: number) => {
  const _where = {};

  _where['id'] = id;

  _where['events_id'] = Sequelize.literal(`'${event_id}' = ANY("events_id")`);

  return _where;
};
