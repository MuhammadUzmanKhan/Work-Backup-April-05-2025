import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Res, UseGuards } from '@nestjs/common';
import { ROLES } from 'src/common/constants/roles';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { RoleGuard } from 'src/common/guards/role.guard';
import { SendInvitationDto } from './dto/send-invite.dto';
import { InvitationService } from './invitation.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from 'src/common/decorators/public.meta';

@Controller('invitation')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) { }

  @ApiBearerAuth()
  @Get("/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public getInvitationbyId(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.invitationService.getInvitationById(id);
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public getAllInvitations() {
    return this.invitationService.getAllInvitations();
  }

  // @Put("update/:id")
  // @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN,ROLES.OWNER))
  // public updateInvite(
  //   @Param("id") id: string,
  //   @Body() updateInvitationDto: UpdateInvitationDto,
  //   @AuthUser() user: Users
  // ) {
  //   return this.invitationService.updateInvite(user, id, updateInvitationDto);
  // }

  @ApiBearerAuth()
  @Delete("/delete/:id")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public deleteInvite(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.invitationService.permanentlyDeleteInvitation(id);
  }

  @ApiBearerAuth()
  @Post()
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
  public sendInvitation(
    @Body() sendInvitationDto: SendInvitationDto,
    @AuthUser() user: Users,
    @Res({ passthrough: true }) res: Response
  ) {
    return this.invitationService.sendInvitation(user, sendInvitationDto, res);
  }

  @ApiBearerAuth()
  @Post("/forgot-password")
  public async forgotPassword(
    @Body('userId', ParseUUIDPipe) userId: string,
    @AuthUser() user: Users
  ) {
    return this.invitationService.forgotPassswordEmailForUser(user, userId);
  }

  // @ApiBearerAuth()
  @Public()
  @Post('/accept-invite/:id')
  public acceptInvitation(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.invitationService.acceptInvitation(id);
  }

  @ApiBearerAuth()
  @Post('/reject-invite/:id')
  public rejectInvitation(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.invitationService.rejectInvitation(id);
  }
}
