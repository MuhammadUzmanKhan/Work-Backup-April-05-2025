import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  statusCheck(): { status: string } {
    return { status: 'ok' };
  }
}
