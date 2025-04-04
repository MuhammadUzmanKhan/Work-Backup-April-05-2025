import { Injectable } from '@nestjs/common';
import { ExternalService } from './external.service';

@Injectable()
export class CatsService {
  constructor(private readonly externalService: ExternalService) {}

  async findAll(): Promise<string[]> {
    const externalData = await this.externalService.fetchData();
    return ['Cat 1', 'Cat 2', externalData];
  }
}
