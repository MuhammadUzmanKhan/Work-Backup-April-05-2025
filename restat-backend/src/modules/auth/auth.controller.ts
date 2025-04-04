import { Controller, Post, Body, Delete, Param, UseGuards, Get, Query } from "@nestjs/common";
import { Public } from "src/common/decorators/public.meta";
import { AuthService } from "./auth.service";
import { AuthenticateUserDto } from "./dto/authenticate.dto";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post("/authenticate")
  public signup(@Body() data: AuthenticateUserDto) {
    return this.authService.authenticateUser(data);
  }

  @Public()
  @Post("/authenticate/sign-in")
  public signin(@Body() data: AuthenticateUserDto) {
    return this.authService.signIn(data);
  }

  @Public()
  @Get("/user-exists")
  public checkUserExists(@Query('email') email: string) {
    return this.authService.checkUserInDb(email);
  }

  @Public()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
  @Delete("/revoke/:id")
  async revokeToken(
    @Param('id') userId: string
  ) {
    await this.authService.revokeToken(userId);
    return { message: "Token revoked successfully" };
  }

  @Public()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
  @Delete("/revoke-company/:id")
  async revokeCompanyToken(
    @Param('id') companyId: string
  ) {
    await this.authService.revokeCompanyTokens(companyId);
    return { message: "Company Tokens revoked successfully" };
  }
}

