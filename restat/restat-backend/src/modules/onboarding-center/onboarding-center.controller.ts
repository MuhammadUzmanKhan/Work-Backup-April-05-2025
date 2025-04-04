import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { OnboardingCenterService } from './onboarding-center.service';
import { ROLES } from 'src/common/constants/roles';
import { RoleGuard } from 'src/common/guards/role.guard';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { IOnboardingStepType } from 'src/types/onboarding';

@Controller('onboarding-center')
export class OnboardingCenterController {
    constructor(
        private readonly onboardingCenterService: OnboardingCenterService,
    ) { }

    @ApiBearerAuth()
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
    @Get()
    public async getOnboardingCenterData(
        @AuthUser() user: Users,
    ) {
        return this.onboardingCenterService.getOnboardingCenterData(user);
    }

    @ApiBearerAuth()
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
    @Post()
    public async createOnboardingCenterData(
        @AuthUser() user: Users,
    ) {
        return this.onboardingCenterService.createOrFindUserOnboarding(user.id);
    }

    @ApiBearerAuth()
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
    @Put()
    public async updateOnboardingSteps(
        @AuthUser() user: Users,
        @Body() type: { key: IOnboardingStepType },
    ) {
        return this.onboardingCenterService.completeOnboardingStep(user, type);
    }

    @ApiBearerAuth()
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
    @Put('/onboarding-complete')
    public async updateUserOnboarding(
        @AuthUser() user: Users,
        @Body() { onBoardingCompleted }: { onBoardingCompleted: boolean },
    ) {
        return this.onboardingCenterService.updateUserOnboarding(user, onBoardingCompleted);
    }
}
