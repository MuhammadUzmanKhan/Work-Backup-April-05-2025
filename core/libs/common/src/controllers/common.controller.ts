import { Controller } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export let AppInjector: ModuleRef;

@Controller()
export class CommonController {
  constructor(private readonly injector: ModuleRef) {
    AppInjector = this.injector;
  }
}
