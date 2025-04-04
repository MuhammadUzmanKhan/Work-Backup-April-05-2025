import { Model, Transaction, Op, FindOptions } from 'sequelize';
import { NamedEntity } from '@Common/constants';

// ** Important **
// This function is also used for vendors untill we have to create vendors with other information as well.

/**
 * This function is generic function to use for those models that has only 2 major fields other than Id and timestamps.
 * And those 2 fields are "name" and "company_id".
 * This function is used to check if records are already created for any of the names the it filters those and then creates
 * only required name records against a company.
 *
 * @param model Any model. Right now we have models i.e Position, PositionName, Area, or DotMapVendor
 * @param items This is array of unique names.
 * @param company_id
 * @param transaction
 * @returns It returns combined list of already existing records and newly created records as well.
 */
export const bulkCreateWithCheck = async <T extends Model>(
  model: { new (): T } & typeof Model,
  items: string[],
  company_id: number,
  transaction: Transaction,
) => {
  // Find existing items in the database
  const findOptions: FindOptions<NamedEntity> = {
    where: {
      name: {
        [Op.iLike]: { [Op.any]: items.map((item) => item.toLowerCase()) },
      },
      company_id,
    },
  };

  const existingItems = await model.findAll(findOptions);

  // Filter out the items that already exist
  const itemsToCreate = items.filter(
    (item) =>
      !existingItems.some(
        (existingItem) =>
          (existingItem.get('name') as unknown as string).toLowerCase() ===
          item.toLowerCase(),
      ),
  );

  // Bulk create the new items
  const createdItems = itemsToCreate.length
    ? await model.bulkCreate(
        itemsToCreate.map((item) => ({ name: item, company_id })),
        { transaction, returning: true },
      )
    : [];

  // Return all the items (existing + newly created)
  return [...createdItems, ...existingItems];
};
