import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  public healthCheck(): { success: boolean } {
    return { success: true };
  }
}
