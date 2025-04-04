import { Controller, Get, Query, Param } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';

@Controller('companies')
export class CompaniesController {
    constructor(
        private readonly companiesService: CompaniesService
    ) { }

    @ApiBearerAuth()
    @Get()
    public getAllCompanies(
        @AuthUser() user: Users,
        @Query('search') search: string,
        @Query('companySize') companySize: string,
        @Query('page') page: number = 1,
        @Query('perPage') perPage: number = 20,
    ) {
        return this.companiesService.getAllCompanies(
            {
                user,
                search,
                companySize,
                page,
                perPage
            }
        );
    }

    @ApiBearerAuth()
    @Get('/:slug')
    public getCompanyById(
        @AuthUser() user: Users,
        @Param('slug') slug: string,
    ) {
        return this.companiesService.getCompanyBySlug(user, slug);
    }
}
