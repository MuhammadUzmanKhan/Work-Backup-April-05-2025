import { Module } from '@nestjs/common';
import { OnboardingCenterController } from './onboarding-center.controller';
import { OnboardingCenterService } from './onboarding-center.service';

@Module({
  controllers: [OnboardingCenterController],
  providers: [OnboardingCenterService]
})
export class OnboardingCenterModule {}
