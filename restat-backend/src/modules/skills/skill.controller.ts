import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { SkillService } from "./skill.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { SkillDto } from "./dto/skill.dto";

@Controller("skills")
export class skillController {
  constructor(private readonly skillService: SkillService) {}

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
        public createskill(@Body() skillDto: SkillDto[]) {
    return this.skillService.createSkills( skillDto );
  }
}
