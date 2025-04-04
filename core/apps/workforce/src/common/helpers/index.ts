import { NotFoundException } from '@nestjs/common';
import { Inventory } from '@ontrack-tech-group/common/models';
import { RESPONSES } from '@ontrack-tech-group/common/constants';

export const isInventoryExists = async (id: number) => {
  const inventory = await Inventory.findByPk(id, {
    attributes: ['id'],
  });

  if (!inventory) throw new NotFoundException(RESPONSES.notFound('Inventory'));

  return inventory;
};
