import { Module } from '@nestjs/common';
import { LinkedinAccountCompanyController } from './linkedin-account-company.controller';
import { LinkedinAccountCompanyService } from './linkedin-account-company.service';

@Module({
    controllers: [LinkedinAccountCompanyController],
    providers: [LinkedinAccountCompanyService]
})
export class LinkedinAccountCompanyModule { }
