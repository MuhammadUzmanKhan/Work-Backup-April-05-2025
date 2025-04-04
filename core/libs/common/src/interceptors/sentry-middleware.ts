import * as Sentry from '@sentry/node';
import * as dotenv from 'dotenv';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

@Injectable()
export class SentryMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    Sentry.configureScope((scope) => {
      scope.setTag('url', req.url); // Attach endpoint URL
      scope.setTag('method', req.method); // Attach HTTP method
    });

    next();
  }
}
