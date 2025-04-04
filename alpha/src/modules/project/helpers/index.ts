import { Op } from "sequelize";
import { GetAllProjectsDto } from "../dto";

export const allProjectsWhere = (getAllProjectsDto: GetAllProjectsDto) => {
  const { keyword } = getAllProjectsDto;
  
  const _where = {};

  if (keyword) {
    _where['name'] = { [Op.iLike]: `%${keyword.toLowerCase()}%` };
  }

  return _where;
};
