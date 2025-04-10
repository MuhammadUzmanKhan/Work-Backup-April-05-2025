import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should call healthCheck and return { success: true }', async () => {
      const result = await appController.healthCheck();
      expect(result).toEqual({ success: true });
    });
  });
});
