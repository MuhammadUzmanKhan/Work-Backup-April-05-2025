import { Sequelize } from 'sequelize-typescript';
import * as models from '../../models';

export const sequelizeTest = async () => {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    models: [...Object.values(models)],
  });

  await sequelize.addModels([models.User]);
};
