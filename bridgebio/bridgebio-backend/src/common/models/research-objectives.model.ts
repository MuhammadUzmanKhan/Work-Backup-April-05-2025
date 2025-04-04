import { TEXT, BOOLEAN, INTEGER } from "sequelize"; // Import BOOLEAN and INTEGER
import { UUID, UUIDV4 } from "sequelize";
import {
    Column,
    PrimaryKey,
    Table,
    Model,
    AllowNull,
    ForeignKey,
    BelongsTo,
    Index 
} from "sequelize-typescript";
import { StrategyAndTreatment } from "./strategy-and-treatment";

@Table({ tableName: 'research-objectives' })
export class ResearchObjectives extends Model<ResearchObjectives> {
  @Index
  @PrimaryKey
  @Column({
      type: UUID,
      defaultValue: UUIDV4 
  })
  id: string;

  @ForeignKey(() => StrategyAndTreatment)
  @AllowNull(false)
  @Column({ type: UUID })
  strategyAndTreatmentId: string;

  @BelongsTo(() => StrategyAndTreatment, "strategyAndTreatmentId")
  strategyAndTreatment?: StrategyAndTreatment;

  @AllowNull(true)
  @Column({ type: TEXT })
  icon?: string;

  @AllowNull(false)
  @Column({ type: TEXT })
  title: string;

  @AllowNull(true)
  @Column({ type: TEXT })
  description?: string;

  @AllowNull(false)
  @Column({ type: BOOLEAN })
  published: boolean;

  @AllowNull(true)
  @Column({ type: INTEGER })
  order?: number;
}
