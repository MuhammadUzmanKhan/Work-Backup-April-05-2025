// src/models/onboarding-step.model.ts
import { Table, Column, Model, ForeignKey, BelongsTo, PrimaryKey } from 'sequelize-typescript';
import { Users } from './users.model';
import { BOOLEAN, UUID, UUIDV4 } from 'sequelize';

@Table({ tableName: 'onboarding_steps', paranoid: true, timestamps: true })
export class OnboardingStep extends Model<OnboardingStep> {
    @PrimaryKey
    @Column({ type: UUID, defaultValue: UUIDV4 })
    id: string;

    @ForeignKey(() => Users)
    @Column({ type: UUID })
    userId: string;

    @Column({ type: BOOLEAN, defaultValue: false })
    addYourTeam: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    buildYourPortfolio: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    createCustomTemplates: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    connectYourProfiles: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    expandYourReach: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    speedUpYourWorkflow: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    syncYourBids: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    efficientDealsManagement: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    automateYourWorkflow: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    centralizeContactInformation: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    streamlineYourProspecting: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    manageBusinessProfileSettings: boolean;

    @Column({ type: BOOLEAN, defaultValue: false })
    analyzeYourPerformance: boolean;

    @BelongsTo(() => Users)
    user: Users;
}
