import { UUID, UUIDV4 } from 'sequelize';
import { Model, Table, Column, PrimaryKey, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { Bids } from './bids.model';
import { Users } from './users.model';

@Table({
  tableName: 'comments',
  timestamps: true, 
})
export class Comments extends Model {
  @PrimaryKey
  @Column({ type: UUID, defaultValue: UUIDV4 })
  id: string;

  @ForeignKey(() => Bids)
  @Column({ type: UUID })
  bidId: string;

  @ForeignKey(() => Users)
  @Column({ type: UUID })
  userId: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  commentText: string;

  @BelongsTo(() => Bids)
  bid: Bids;

  @BelongsTo(() => Users)
  user: Users;
}
