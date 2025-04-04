import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ROLES } from 'src/common/constants/roles';
import { RoleGuard } from 'src/common/guards/role.guard';
import { UpworkApisService } from './upwork-apis.service';
import { FetchProposalDto } from './dto/get-proposals.dto';

@Controller('upwork-apis')
export class UpworkApisController {
    constructor(private readonly upworkApisService: UpworkApisService) { }

    @ApiBearerAuth()
    @Get("/refresh-token/:refreshToken")
    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    public getAccessTokenByRefreshToken(
      @Param('refreshToken') refreshToken: string,
    ) {
      return this.upworkApisService.generateAccessToken(refreshToken);
    }

    @ApiBearerAuth()
    @Post("/proposals")
    @UseGuards(RoleGuard(ROLES.SUPER_ADMIN))
    public getVendorProposal(
      @Body() data: FetchProposalDto,
    ) {
      return this.upworkApisService.populateProposalFromUpwork(data);
    }
}
