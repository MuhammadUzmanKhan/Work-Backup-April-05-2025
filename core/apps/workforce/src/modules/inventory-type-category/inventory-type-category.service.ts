import { Injectable } from '@nestjs/common';
import { withCompanyScope } from '@ontrack-tech-group/common/helpers';
import {
  Event,
  InventoryTypeCategory,
  User,
} from '@ontrack-tech-group/common/models';
import { SortBy } from '@ontrack-tech-group/common/constants';
import { InventoryTypeCategoryQueryParamsDto } from './dto';

@Injectable()
export class InventoryTypeCategoryService {
  async getAllInventoryTypeCategories(
    inventoryTypeCategoryQueryParamsDto: InventoryTypeCategoryQueryParamsDto,
    user: User,
  ) {
    // TODO: need to update company-id here
    const { event_id } = inventoryTypeCategoryQueryParamsDto;
    let company_id = user['company_id'];

    if (event_id) {
      [company_id] = await withCompanyScope(user, event_id);
    }

    return await InventoryTypeCategory.findAll({
      where: { company_id },
      attributes: ['id', 'name', 'is_default', 'company_id'],
      include: event_id
        ? [
            {
              model: Event,
              where: { id: event_id },
              attributes: [],
            },
          ]
        : [],
      order: [['created_at', SortBy.DESC]],
    });
  }
}
