import { Controller, Get } from '@nestjs/common';
import { CustomerService } from 'src/customers/customer.services';

@Controller('cats')
export class CatsController {
  constructor(private readonly customerService: CustomerService) {}
  @Get()
  getCustomers() {
    return this.customerService.getAllCustomers();
  }
}
