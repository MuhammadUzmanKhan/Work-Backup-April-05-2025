import { INTEGER, TEXT } from 'sequelize';
import {
  Column,
  PrimaryKey,
  Table,
  Model,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User, Comment } from '..';

@Table({
  tableName: 'comment_mentions',
  underscored: true,
  timestamps: true,
})
export class CommentMention extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: INTEGER })
  id: number;

  @ForeignKey(() => Comment)
  @Column({ type: INTEGER })
  comment_id: number;

  @BelongsTo(() => Comment)
  comment: Comment;

  @ForeignKey(() => User)
  @Column({ type: INTEGER })
  user_id: number;

  @BelongsTo(() => User)
  user: User;
}
