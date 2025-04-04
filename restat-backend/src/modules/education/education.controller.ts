import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { EducationService } from "./education.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { EducationEntityDto } from "./dto/education.dto";

@Controller("education")
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
        public createEducation(@Body() educationDto: EducationEntityDto) {
    return this.educationService.createEducation({ educationDto });
  }
}
