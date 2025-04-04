import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { InstitutionService } from "./institution.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { InstitutionDto } from "./dto/institution.dto";

@Controller("institutions")
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
        public createInstitution(@Body() institutionDto: InstitutionDto) {
    return this.institutionService.createInstitution({ institutionDto });
  }
}
