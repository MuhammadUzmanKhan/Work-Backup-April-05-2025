import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ErrorService } from "./error.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { ErrorDto } from "./dto/error.dto";
import { AuthUser } from "src/common/decorators/auth-request-user.meta";
import { Users } from "src/common/models/users.model";

@Controller("errors")
export class ErrorController {
  constructor(private readonly errorService: ErrorService) {}

  @ApiBearerAuth()
  @Post("/create")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
        public createError(
          @AuthUser() user: Users,
          @Body() errorDto: ErrorDto) {
    return this.errorService.createError({ user,  errorDto });
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
        public getAllErrors() {
    return this.errorService.getAllErrors();
  }
}
