import {
    Table,
    Column,
    Model,
    ForeignKey,
    BelongsTo,
    Index,
    PrimaryKey,
    AllowNull,
    HasMany
} from 'sequelize-typescript';
import {
    UUID,
    STRING,
    BOOLEAN,
    INTEGER,
    Op,
    TEXT
} from 'sequelize';
import { UUIDV4 } from 'sequelize';
import { Medicines } from './medicines.model';
import { ResearchObjectives } from './research-objectives.model';
import { ResearchObjectiveDto } from '@modules/strategy-and-treatment/dto/research-objective.dto';

@Table({
    tableName: 'strategy-and-treatment',
    timestamps: true,
    paranoid: true
})
export class StrategyAndTreatment extends Model<StrategyAndTreatment> {
    @Index
    @PrimaryKey
    @Column({
        type: UUID,
        defaultValue: UUIDV4
    })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    icon: string;

    @AllowNull(false)
    @Column({ type: TEXT })
    title: string;

    @AllowNull(false)
    @Column({ type: TEXT })
    description: string;

    @AllowNull(false)
    @Column({
        type: BOOLEAN,
        defaultValue: false
    })
    published: boolean;

    @AllowNull(false)
    @Column({ type: INTEGER })
    order: number;

    @ForeignKey(() => Medicines)
    @AllowNull(false)
    @Column({ type: UUID })
    medId: string;

    @BelongsTo(() => Medicines)
    medicine: Medicines;

    @HasMany(() => ResearchObjectives)
    researchObjectives: ResearchObjectives[];

    public async createResearchObjectives(researchObjectives: ResearchObjectiveDto[]) {
        const objectivesToCreate = researchObjectives.map((researchObjective, i) => ({
            ...researchObjective,
            order: i + 1,
            strategyAndTreatmentId: this.id
        }));

        this.researchObjectives = await ResearchObjectives.bulkCreate(objectivesToCreate, { returning: true });
    }

    public async updateResearchObjectives(researchObjectives: ResearchObjectiveDto[]) {
        const objectivesToUpdate = researchObjectives.map((researchObjective, i) => ({
            strategyAndTreatmentId: this.id,
            order: i + 1,
            ...researchObjective
        }));

        return Promise.all(objectivesToUpdate
            .map(item => item.id ?
                ResearchObjectives.update(item, { where: { id: item.id } })
                :
                ResearchObjectives.create(item)));
    }

    public async deleteResearchObjective(researchObjectivesToKeep: ResearchObjectiveDto[]) {
        await ResearchObjectives.destroy({
            where: {
                strategyAndTreatmentId: this.id,
                id: { [Op.notIn]: researchObjectivesToKeep.map(a => a.id) }
            }
        });
    }
}
