import { Injectable } from '@nestjs/common';
import { RollbarLogger } from 'nestjs-rollbar';

@Injectable()
export class LoggerService {
  constructor(private readonly rollbarLogger: RollbarLogger) {}

  error(error: any, method: string) {
    this.rollbarLogger.error(error, method);
  }

  warning(warning: any, method: string) {
    this.rollbarLogger.warning(warning, method);
  }

  log(message: any, method: string) {
    this.rollbarLogger.log(message, method);
  }

  info(info: any, method: string) {
    this.rollbarLogger.info(info, method);
  }
}
