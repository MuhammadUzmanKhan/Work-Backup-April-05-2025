import { Module } from '@nestjs/common';
import { UsersPinsService } from './users-pins.service';

@Module({
  providers: [UsersPinsService],
  exports: [UsersPinsService],
})
export class UsersPinsModule {}
