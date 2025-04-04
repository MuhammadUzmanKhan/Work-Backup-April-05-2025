import { Body, Controller, Get, Post } from '@nestjs/common';
import { CustomerService } from './customer.services';

@Controller('customer')
export class CustomerController {
  constructor(private customerService: CustomerService) {}
  @Get()
  getAllCustomers() {
    return this.customerService.getAllCustomers();
  }
  @Post()
  createCustomer(@Body() body) {
    this.customerService.createCustomer(body);
  }
}
