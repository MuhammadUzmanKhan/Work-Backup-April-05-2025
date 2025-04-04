import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '@common/types';
import {
    ApiBearerAuth,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ApiTagNames, RESPONSES } from '@common/constants';
import { OktaUser } from '@common/decorators/okta.decorator';
import { AuthUser } from '@common/auth/auth-requests';
import { Users } from '@common/models/users.model';

@Controller('users')
@ApiTags(ApiTagNames.USERS)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @OktaUser()
    @Get()
    @ApiOkResponse()
    @ApiUnauthorizedResponse({ description: RESPONSES.UNAUTHORIZED })
    @ApiNotFoundResponse({ description: RESPONSES.NOT_FOUND })
    @ApiBearerAuth()
    public getUser(@AuthUser() user: Users) {
        return user;
    }

    @UseGuards(PermissionsGuard(Permissions.SUPER_ADMIN))
    @Get("super-admin-test")
    @ApiOkResponse({ description: 'You are a Super Admin' })
    @ApiUnauthorizedResponse({ description: 'Only Super Admin can access this route.' })
    @ApiBearerAuth()
    public superAdminRoute() {
        return "Super Admin Route Accessible";
    }

    @UseGuards(PermissionsGuard(Permissions.MEDS))
    @OktaUser()
    @Get('meds-test')
    @ApiOkResponse({ description: 'Your permission is Meds.' })
    @ApiUnauthorizedResponse({ description: 'Only Meds can access this route.' })
    @ApiBearerAuth()
    public medRoute() {
        return "Meds Route Accessible";
    }

    @OktaUser()
    @UseGuards(PermissionsGuard(Permissions.EVIDENCE_GENERATION_FRAMEWORK, Permissions.MEDS))
    @Get('multiple-permissions-test')
    @ApiOkResponse()
    @ApiUnauthorizedResponse({ description: 'Only authorized personnel can access this route.' })
    @ApiBearerAuth()
    public multiplePermissionsRoute() {
        return "Multiple PermissionsRoute Accessible";
    }

    @OktaUser()
    @ApiOkResponse()
    @ApiUnauthorizedResponse()
    @ApiBearerAuth()
    @Get('okta-user')
    public oktaUser() {
        return "Okta User Route Accessible";
    }
}
