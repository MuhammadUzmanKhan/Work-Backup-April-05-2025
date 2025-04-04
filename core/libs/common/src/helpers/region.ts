/**
 * This file contains all the helper functions related to regions
 */

import { Op } from 'sequelize';
import * as _ from 'lodash';
import { RolesNumberEnum, SubcompanyCategoryType } from '../constants';
import { Company, Region, User } from '../models';
import { getQueryListParam, getScopeAndCompanyIds } from '.';

export const getRegionsAndSubRegionsHelper = async (ids: number[]) => {
  if (ids?.length) {
    const regions = await Region.findAll({
      attributes: ['id', 'name', 'parent_id'],
      where: {
        parent_id: ids, // Directly use region_ids here
      },
      raw: true,
    });

    return regions.map(({ id }) => id);
  }
};

export const getRegionsAndSubRegions = async (region_ids: number[]) => {
  // Get the list of query parameters from the region_ids array
  const filteredRegionIds = getQueryListParam(region_ids);

  // If no valid region IDs are provided, return an empty array
  if (!filteredRegionIds?.length) return null;

  // Get filtered regions and sub-region IDs
  const filteredRegionAndSubRegionIds =
    await getRegionsAndSubRegionsHelper(filteredRegionIds);

  return [...new Set([...filteredRegionAndSubRegionIds, ...filteredRegionIds])];
};

export const userRegionsWhere = async (
  user: User,
  raw: boolean,
  isCompany = false,
  filterCompanyIds?: number[],
  categoryFilter?: string[],
  filterRegionIds?: number[],
) => {
  const _where = {};

  if (
    (user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
    user['region_ids']?.length
  ) {
    let authenticRegionIds = await getRegionsAndSubRegions(user['region_ids']);

    if (filterRegionIds) {
      const filteredRegionIds = await getRegionsAndSubRegions(filterRegionIds);

      authenticRegionIds = _.intersection(
        authenticRegionIds,
        filteredRegionIds,
      );
    }

    let { companyIds } = await getScopeAndCompanyIds(user);

    if (filterCompanyIds?.length) {
      companyIds = _.intersection(companyIds, filterCompanyIds);
    }

    // It will check if category is not standard than we need to apply category. It will get category in array.
    const category =
      user['category'] &&
      (user['category'] === SubcompanyCategoryType.FESTIVALS ||
        user['category'] === SubcompanyCategoryType.VENUES)
        ? [user['category']]
        : null;

    const _companyIds = (
      await Company.findAll({
        where: {
          region_id: { [Op.in]: authenticRegionIds },
          id: { [Op.in]: companyIds },
          ...(category ? { category: { [Op.in]: category } } : {}),
        },
      })
    ).map((company) => company.id);

    if (raw)
      return ` AND "events"."company_id" IN (${
        _companyIds?.length ? _companyIds : 'NULL'
      })`;
    else {
      if (isCompany) {
        // It will get query param in array if its a single value
        const _categoryFilter = getQueryListParam(categoryFilter);

        // It will check if category is not standard than we need to apply category. It will get category in array.
        const category =
          user['category'] &&
          (user['category'] === SubcompanyCategoryType.FESTIVALS ||
            user['category'] === SubcompanyCategoryType.VENUES)
            ? [user['category']]
            : null;

        if (category) {
          _where['category'] = { [Op.in]: category };
        }

        // If it has category and filter as well then we need to get intersection for it.
        if (category && categoryFilter) {
          _where['category'] = {
            [Op.in]: _.intersection(category, _categoryFilter),
          };
        }

        _where['region_id'] = {
          [Op.in]: authenticRegionIds,
        };
      } else {
        _where['company_id'] = {
          [Op.in]: _companyIds,
        };
      }
    }
  } else if (
    (user['role'] === RolesNumberEnum.GLOBAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_MANAGER ||
      user['role'] === RolesNumberEnum.REGIONAL_ADMIN) &&
    !user['region_ids']?.length
  ) {
    if (raw) return ` AND "events"."region_id" IS NULL`;
    else {
      _where['region_id'] = {
        [Op.eq]: null,
      };
    }
  }

  return _where['region_id'] || _where['company_id'] ? _where : '';
};
