import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalService {
  async fetchData(): Promise<string> {
    // Simulate fetching data from an external API or service
    return 'External Cat';
  }
}
