import { Sequelize } from 'sequelize';
import { Table, Column, Model } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ defaultValue: Sequelize.fn('NOW') })
  createdAt: Date;

  @Column({ defaultValue: Sequelize.fn('NOW') })
  updatedAt: Date;
}
