import {
    Body,
    Controller,
    Post,
    Put,
    UseGuards
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserCredentials } from './dto/user-credentials.dto';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { Public } from '@common/decorators/public.decorator';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse 
} from '@nestjs/swagger';
import { ApiTagNames, RESPONSES } from '@common/constants';
import { PermissionsGuard } from './guards/permissions.guard';
import { Permissions} from '@common/types';
import { UpdateUserPermissionsDto } from './dto/update-permissions.dto';

@Controller('auth')
@ApiTags(ApiTagNames.AUTHENTICATION)
export class AuthController {
    constructor(readonly authService: AuthService) { }

    @Public()
    @ApiTags(ApiTagNames.PUBLIC)
    @Post('create-super-admin')
    @ApiCreatedResponse({ description: RESPONSES.SUPER_ADMIN_CREATED })
    @ApiUnauthorizedResponse({ description: RESPONSES.INVALID_ADMIN_KEY })
    public async createSuperAdmin(@Body() superAdminCredentials: CreateSuperAdminDto) {
        return this.authService.createSuperAdmin(superAdminCredentials);
    }

    @Public()
    @ApiTags(ApiTagNames.PUBLIC)
    @Post('super-admin-login')
    @ApiOkResponse({ description: RESPONSES.USER_LOGGED_IN })
    @ApiUnauthorizedResponse({ description: RESPONSES.INVALID_CREDENTIALS })
    public async loginUser(@Body() credentials: UserCredentials) {
        return this.authService.login(credentials);
    }

    @ApiTags(ApiTagNames.SUPER_ADMIN)
    @UseGuards(PermissionsGuard(Permissions.SUPER_ADMIN))
    @Put('update-user-permissions')
    @ApiBearerAuth()
    @ApiOkResponse({ description: RESPONSES.UPDATION_SUCCESSFUL })
    @ApiUnauthorizedResponse({ description: RESPONSES.UNAUTHORIZED })
    @ApiNotFoundResponse({ description: RESPONSES.NOT_FOUND })
    public async updateUserPermissions(@Body() permissionsData: UpdateUserPermissionsDto) {
        return this.authService.updateUserPermissions(permissionsData);
    }
}
