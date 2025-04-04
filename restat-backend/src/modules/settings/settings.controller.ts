import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { SettingsDto } from "./dto/settings.dto";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public createCompanySettings(@Body() settingsDto: SettingsDto,
    @AuthUser() user: Users,
  ) {
    return this.settingsService.createCompanySettings({ settingsDto }, user);
  }

  @ApiBearerAuth()
  @Post("/user")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.MANAGER, ROLES.BIDDER))
  public createUserSettings(@Body() settingsDto: SettingsDto,
    @AuthUser() user: Users,
  ) {
    return this.settingsService.createUserSettings({ settingsDto }, user);
  }
}
