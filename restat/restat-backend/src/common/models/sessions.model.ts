import { Model, Column, ForeignKey, Table, DataType, BelongsTo } from 'sequelize-typescript';
import { Users } from './users.model';
@Table({ tableName: 'sessions', paranoid: true, timestamps: true })
export class Sessions extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => Users)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  userId: string;

  @BelongsTo(() => Users)
  user: Users;

}
