import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ExperienceService } from "./experience.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { ExperienceEntityDto } from "./dto/experience.dto";

@Controller("experience")
export class experienceController {
  constructor(private readonly experienceService: ExperienceService) { }

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.OWNER))
  public createExperience(@Body() experienceDto: ExperienceEntityDto) {
    return this.experienceService.createExperience({ experienceDto });
  }
}
