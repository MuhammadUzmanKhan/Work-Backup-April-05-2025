import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomerService {
  customers = [];
  getAllCustomers() {
    return this.customers;
  }
  createCustomer(customer) {
    this.customers.push(customer);
  }
}
