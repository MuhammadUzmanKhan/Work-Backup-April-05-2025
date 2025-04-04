import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ROLES } from 'src/common/constants/roles';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { RoleGuard } from 'src/common/guards/role.guard';
import { Users } from 'src/common/models/users.model';
import { ContactService } from './contacts.service';
import { LINKEDIN_CONNECTION_TYPE } from 'src/common/constants/linkedin';
import { DateProps } from '../bids/bids-jobs-accounts.service';
import * as moment from 'moment';
import { SOURCE } from 'src/common/constants/source';

@Controller('contacts')
export class ContactController {
    constructor(
        private readonly contactService: ContactService,
    ) { }


    @ApiBearerAuth()
    @Get("/")
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.OWNER))
    public getAllContactsAPI(
        @AuthUser() user: Users,
        @Query("search") search: string,
        @Query("source") source: SOURCE,
        @Query("linkedInType") linkedInType: LINKEDIN_CONNECTION_TYPE,
        @Query("upworkProfile") upworkProfile: string,
        @Query("linkedinProfile") linkedinProfile: string,
        @Query("bidder") bidder: string,
        @Query("industries") industries: string,
        @Query("page", ParseIntPipe) page: number = 1,
        @Query("startDate") startDate: any,
        @Query("endDate") endDate: any,
        @Query("perPage") perPage: string,
    ) {
        const dates: DateProps = {
            startDate: ['undefined', undefined, null].includes(startDate) ? undefined : moment(startDate).toISOString(),
            endDate: ['undefined', undefined, null].includes(endDate) ? undefined : moment(endDate).toISOString()
        }
        return this.contactService.getAllContacts(
            {
                user,
                search,
                source,
                linkedInType,
                upworkProfile: upworkProfile?.split(','),
                linkedinProfile: linkedinProfile?.split(','),
                bidder: bidder?.split(','),
                industries: industries?.split(','),
                dates,
                page,
                perPage,
            }
        );
    }


    @ApiBearerAuth()
    @Get("/excel")
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.OWNER))
    public getExcelContactsAPI(
        @AuthUser() user: Users,
        @Query("search") search: string,
        @Query("source") source: SOURCE,
        @Query("linkedInType") linkedInType: LINKEDIN_CONNECTION_TYPE,
        @Query("upworkProfile") upworkProfile: string,
        @Query("linkedinProfile") linkedinProfile: string,
        @Query("bidder") bidder: string,
        @Query("industries") industries: string,
        @Query("startDate") startDate: any,
        @Query("endDate") endDate: any,
    ) {
        const dates: DateProps = {
            startDate: ['undefined', undefined, null].includes(startDate) ? undefined : moment(startDate).toISOString(),
            endDate: ['undefined', undefined, null].includes(endDate) ? undefined : moment(endDate).toISOString()
        }
        return this.contactService.getExcelContacts(
            {
                user,
                search,
                source,
                linkedInType,
                upworkProfile: upworkProfile?.split(','),
                linkedinProfile: linkedinProfile?.split(','),
                bidder: bidder?.split(','),
                industries: industries?.split(','),
                dates
            }
        );
    }

    @ApiBearerAuth()
    @Get("/addMapData")
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.OWNER))
    public updateLocationCountryAndState() {
        return this.contactService.mapLocationToCountryAndState();
    }

    @ApiBearerAuth()
    @Get("/:slug")
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.OWNER))
    public getContactBySlug(
        @AuthUser() user: Users,
        @Param("slug") slug: string,
    ) {
        return this.contactService.getContactBySlug(user.companyId, slug);
    }

}
