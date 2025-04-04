import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    console.log('Mai toh yahan tak pohanch chuka hoo..middle ware', req?.path);
    next();
  }
}
