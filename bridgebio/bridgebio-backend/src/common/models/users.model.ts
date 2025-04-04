import { UUID, STRING, BOOLEAN, JSONB } from 'sequelize';
import { UUIDV4 } from 'sequelize';
import {
    Table,
    Column,
    Model,
    Index,
    PrimaryKey,
    AllowNull
} from 'sequelize-typescript';
import { Permissions } from '../types';

@Table({
    tableName: "users",
    timestamps: true,
    paranoid: true
})
export class Users extends Model<Users> {
    @Index
    @PrimaryKey
    @Column({
        type: UUID,
        defaultValue: UUIDV4
    })
    id: string;

    @AllowNull(false)
    @Column({ type: STRING })
    name: string;

    @AllowNull(false)
    @Column({ type: STRING })
    email: string;

    @AllowNull(true)
    @Column({ type: STRING })
    password: string;

    @AllowNull(false)
    @Column({
        type: BOOLEAN,
        defaultValue: false
    })
    isOktaUser: boolean;

    @AllowNull(false)
    @Column({
        type: JSONB,
        defaultValue: {
            [Permissions.SUPER_ADMIN]: false,
            [Permissions.MEDS]: false,
            [Permissions.EVIDENCE_GENERATION_FRAMEWORK]: false,
            [Permissions.EVIDENCE_GENERATION_PRIORITIES]: false,
            [Permissions.EVIDENCE_LITERATURE_LIBRARY]: false,
            [Permissions.RESEARCH_INITIATIVES]: false,
            [Permissions.RESEARCH_TEAMS]: false,
            isSetByAdmin: false
        }
    })
    permissions: {
        [Permissions.SUPER_ADMIN]: boolean;
        [Permissions.MEDS]: boolean;
        [Permissions.EVIDENCE_GENERATION_FRAMEWORK]: boolean;
        [Permissions.EVIDENCE_GENERATION_PRIORITIES]: boolean;
        [Permissions.EVIDENCE_LITERATURE_LIBRARY]: boolean;
        [Permissions.RESEARCH_INITIATIVES]: boolean;
        [Permissions.RESEARCH_TEAMS]: boolean;
        isSetByAdmin: boolean;
    };
    existingUser: Record<Permissions, boolean>;
}
