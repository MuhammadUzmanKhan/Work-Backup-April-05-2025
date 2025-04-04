import { Controller, Post, Body, Delete, Param, UseGuards, Get, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { Public } from "src/common/decorators/public.meta";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { AuthService } from "./auth.service";
import { AuthenticateUserDto } from "./dto/authenticate.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post("/authenticate")
  public signup(
    @Req() req: Request,
    @Body() data: AuthenticateUserDto) {
    return this.authService.authenticateUser(data, req);
  }

  @Public()
  @Post("/authenticate/sign-in")
  public signin(
    @Body() data: AuthenticateUserDto
  ) {
    return this.authService.signIn(data);
  }

  @Public()
  @Get("/user-exists")
  public checkUserExists(@Query('email') email: string) {
    return this.authService.checkUserInDb(email);
  }

  @Public()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.OWNER))
  @Delete("/revoke/:id")
  async revokeToken(
    @Param('id') userId: string
  ) {
    await this.authService.revokeToken(userId);
    return { message: "Token revoked successfully" };
  }

  @Public()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  @Delete("/revoke-company/:id")
  async revokeCompanyToken(
    @Param('id') companyId: string
  ) {
    await this.authService.revokeCompanyTokens(companyId);
    return { message: "Company Tokens revoked successfully" };
  }
}

