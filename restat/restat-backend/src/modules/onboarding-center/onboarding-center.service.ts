import { Injectable, NotFoundException } from '@nestjs/common';
import { PORTFOLIO_TYPE } from 'src/common/constants/portfolio_type';
import { IOnboardingStepType } from 'src/types/onboarding';
import { SOURCE } from 'src/common/constants/source';
import { Bids } from 'src/common/models/bids.model';
import { Contacts } from 'src/common/models/contacts.model';
import { Integrations } from 'src/common/models/integrations.model';
import { LinkedinReferences } from 'src/common/models/linkedin-reference';
import { OnboardingStep } from 'src/common/models/onboarding-steps.model';
import { Portfolios } from 'src/common/models/portfolios.model';
import { Profiles } from 'src/common/models/profiles.model';
import { Users } from 'src/common/models/users.model';

@Injectable()
export class OnboardingCenterService {
    constructor() { }

    public async getOnboardingCenterData(user: any) {
        const onboardingCenterData = OnboardingStep.findOne({ where: { userId: user.id } });
        if (!onboardingCenterData) {
            throw new NotFoundException("Onboarding data not found");
        }
        return onboardingCenterData;
    }

    public async createOrFindUserOnboarding(userId: string) {
        let userOnboarding = await OnboardingStep.findOne({ where: { userId } });
        if (!userOnboarding) {
            userOnboarding = await OnboardingStep.create({ userId });
        }
        return {
            success: true,
            message: "Onboarding data created successfully",
            data: userOnboarding
        }
    }

    public async completeOnboardingStep(user: any, type: { key: IOnboardingStepType }) {
        const userOnboarding = await OnboardingStep.findOne({ where: { userId: user.id } });
        if (!userOnboarding) {
            throw new NotFoundException("Onboarding data not found");
        }
        switch (type.key) {
            case IOnboardingStepType.addYourTeam:
                const teamCount = await Users.count({ where: { companyId: user.companyId } });
                if (teamCount > 1) {
                    userOnboarding.addYourTeam = true;
                }
                break;
            case IOnboardingStepType.buildYourPortfolio:
                const profileCount = await Portfolios.count({ where: { companyId: user.companyId, type: [PORTFOLIO_TYPE.PROJECT, PORTFOLIO_TYPE.CASE_STUDY, PORTFOLIO_TYPE.LINK] } });
                if (profileCount) {
                    userOnboarding.buildYourPortfolio = true;
                }
                break;
            case IOnboardingStepType.createCustomTemplates:
                const templatesCount = await Portfolios.count({ where: { companyId: user.companyId, type: PORTFOLIO_TYPE.TEMPLATE } });
                if (templatesCount) {
                    userOnboarding.createCustomTemplates = true;
                }
                break;
            case IOnboardingStepType.connectYourProfiles:
                const profileConnected = await Profiles.count({ where: { companyId: user.companyId } });
                if (profileConnected) {
                    userOnboarding.connectYourProfiles = true;
                }
                break;
            case IOnboardingStepType.expandYourReach:
                const integration = await Integrations.count({ where: { companyId: user.companyId } });
                if (integration) {
                    userOnboarding.expandYourReach = true;
                }
                break;
            case IOnboardingStepType.speedUpYourWorkflow:
                userOnboarding.speedUpYourWorkflow = true;
                break;
            case IOnboardingStepType.syncYourBids:
                const bidsCount = await Bids.count({ where: { userId: user.id } });
                if (bidsCount) {
                    userOnboarding.syncYourBids = true;
                }
                break;
            case IOnboardingStepType.efficientDealsManagement:
                userOnboarding.efficientDealsManagement = true;
                break;
            case IOnboardingStepType.automateYourWorkflow:
                const automationCount = await Contacts.count({ where: { workspaceId: user.companyId, source: SOURCE.LINKEDIN } });
                if (automationCount) {
                    userOnboarding.automateYourWorkflow = true;
                }
                break;
            case IOnboardingStepType.centralizeContactInformation:
                const contactCount = await Contacts.count({ where: { workspaceId: user.companyId } });
                if (contactCount) {
                    userOnboarding.centralizeContactInformation = true;
                }
                break;
            case IOnboardingStepType.streamlineYourProspecting:
                const linkedinReferences = await LinkedinReferences.count({ where: { userId: user.id, linkedinConnected: true } });
                if (linkedinReferences) {
                    userOnboarding.streamlineYourProspecting = true;
                }
                break;
            case IOnboardingStepType.manageBusinessProfileSettings:
                userOnboarding.manageBusinessProfileSettings = true;
                break;
            case IOnboardingStepType.analyzeYourPerformance:
                userOnboarding.analyzeYourPerformance = true;
                break;
            default:
                throw new NotFoundException("Invalid onboarding step type");
        }

        await userOnboarding.save();

        return {
            success: true,
            message: `Onboarding step ${type.key} completed successfully`,
            data: userOnboarding
        }

    }

    public async updateUserOnboarding(user: any, onBoardingCompleted: boolean) {
        const userData = await Users.update({ onBoardingCompleted }, { where: { id: user.id } });
        if (!userData) {
            throw new NotFoundException("User not found");
        }
        return {
            success: true,
            message: "User onboarding status updated successfully",
            data: userData
        }
    }
}
