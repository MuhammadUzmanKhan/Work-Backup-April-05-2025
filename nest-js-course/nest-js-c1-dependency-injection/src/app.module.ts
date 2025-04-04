import { Module } from '@nestjs/common';
import { CustomerController } from './customers/customer.controller';
import { CustomerService } from './customers/customer.services';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  imports: [],
  controllers: [CustomerController, CatsController],
  providers: [CustomerService, CatsService],
})
export class AppModule {}
