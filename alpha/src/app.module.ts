import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { PromptService } from './modules/prompt/prompt.service';
import { PromptModule } from './modules/prompt/prompt.module';
import { ProjectService } from './modules/project/project.service';
import { ProjectModule } from './modules/project/project.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    AuthModule,
    PromptModule,
    ProjectModule,
  ],
  controllers: [AppController],
  providers: [AppService, PromptService, ProjectService],
})
export class AppModule {}
