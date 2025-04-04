import { Request, Response } from 'express';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  AuthUserWithoutRole,
  Public,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { AuthService } from './auth.service';
import {
  ChangeNumberDto,
  CreatePinDto,
  VerifyPinDto,
  ImpersonateDto,
  ManageMfaDto,
} from './dto';
import { changeNumber, createPin, manageMfa, verifyPin } from './body';

@ApiTags('Sessions')
@Controller('sessions')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/create-pin')
  @ApiOperation({
    summary: 'Create Pin for User Authentication',
  })
  @ApiBody(createPin)
  createPin(@Body() createPinDto: CreatePinDto) {
    return this.authService.createPin(createPinDto);
  }

  @Public()
  @Post('/verify-pin')
  @ApiOperation({
    summary: 'Verify Pin',
  })
  @ApiBody(verifyPin)
  verifyPin(@Body() verifyPinDto: VerifyPinDto) {
    return this.authService.verifyPin(verifyPinDto);
  }

  @Public()
  @Post('/verify-mfa')
  @ApiOperation({
    summary: 'Verify MFA',
  })
  @ApiBody(verifyPin)
  verifyMFA(@Body() verifyMFADto: VerifyPinDto) {
    return this.authService.verifyMFA(verifyMFADto);
  }

  @Public()
  @Post('/mobile/verify-pin')
  @ApiOperation({
    summary: 'Verify Pin for Mobile Application',
  })
  @ApiBody(verifyPin)
  verifyPinMobile(@Body() verifyPinDto: VerifyPinDto) {
    return this.authService.verifyPinMobile(verifyPinDto);
  }

  @Public()
  @Post('/change-number')
  @ApiOperation({
    summary: 'Change Number',
  })
  @ApiBody(changeNumber)
  changeNumber(@Body() changeNumberDto: ChangeNumberDto) {
    return this.authService.changeNumber(changeNumberDto);
  }

  @ApiBearerAuth()
  @Post('/manage-mfa')
  @ApiOperation({
    summary: 'Manage MFA for User Authentication',
  })
  @ApiBody(manageMfa)
  async manageMfa(@AuthUser() user: User, @Body() manageMfaDto: ManageMfaDto) {
    return this.authService.manageMfa(manageMfaDto, user);
  }

  @ApiBearerAuth()
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.USER_ACT_AS_USER)
  @Post('/impersonate')
  @ApiOperation({
    summary:
      'Impersonate other users using UserId as "id" except itself and other super admins.',
  })
  impersonateUser(@Body() impersonateDto: ImpersonateDto) {
    return this.authService.impersonateUser(impersonateDto);
  }

  @ApiBearerAuth()
  @Get('/user-role-companies')
  @ApiOperation({
    summary: 'Return companies and role of auth user',
  })
  userRoleAndCompanies(@AuthUserWithoutRole() user: User) {
    return this.authService.userRoleAndCompanies(user.id);
  }

  @ApiBearerAuth()
  @ApiHeader(COMPANY_ID_API_HEADER)
  @Post('/pusher')
  pusherAuth(
    @Res() res: Response,
    @Req() req: Request,
    @AuthUser() user: User,
  ) {
    return this.authService.authenticatePusherChannel(res, req, user);
  }
}
