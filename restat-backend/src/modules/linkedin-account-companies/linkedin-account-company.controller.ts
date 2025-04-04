import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { LinkedinAccountCompanyService } from "./linkedin-account-company.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { LinkedinAccountCompanyDto } from "./dto/linkedin-account-company.dto";

@Controller("linkedinAccountCompanies")
export class LinkedinAccountCompanyController {
  constructor(private readonly linkedinAccountCompanyService: LinkedinAccountCompanyService) {}

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
        public createLinkedinAccountCompany(@Body() linkedinAccountCompanyDto: LinkedinAccountCompanyDto) {
    return this.linkedinAccountCompanyService.createLinkedinAccountCompany({ linkedinAccountCompanyDto });
  }
}
