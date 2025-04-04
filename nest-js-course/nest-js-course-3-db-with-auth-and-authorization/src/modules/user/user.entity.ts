import { Sequelize } from 'sequelize';
import {
  Table,
  Column,
  Model,
  DataType,
  BeforeUpdate,
  BeforeCreate,
} from 'sequelize-typescript';
import * as bcrypt from 'bcryptjs';

@Table
export class User extends Model {
  @Column({ primaryKey: true, autoIncrement: true })
  id: number;

  @Column
  name: string;

  @Column({ unique: true })
  email: string;

  @Column
  password: string;

  @Column({
    type: DataType.ENUM,
    values: ['admin', 'user'],
    defaultValue: 'user',
  })
  role: string;

  @Column({ defaultValue: Sequelize.fn('NOW') })
  createdAt: Date;

  @Column({ defaultValue: Sequelize.fn('NOW') })
  updatedAt: Date;

  @BeforeCreate
  @BeforeUpdate
  static async hashPassword(user: User) {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
}
