import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Query, UseGuards } from '@nestjs/common';
import { BidService } from './bids.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from 'src/common/guards/role.guard';
import { ROLES } from 'src/common/constants/roles';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { BidJobAccountService, DateProps } from './bids-jobs-accounts.service';
import * as moment from 'moment-timezone';
import { BID_TYPES } from 'src/common/constants/bids';
import { UpdateBidDto } from './dto/bid-details.dto';
import { INTEGRATION_TYPES } from 'src/common/constants/integrations';
@Controller('')
export class BidsController {
    constructor(private readonly bidService: BidService,
        private readonly bidJobAccountService: BidJobAccountService) { }

    @ApiBearerAuth()
    @Put('/bids/:id')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
    public updateBidDetails(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() bidDetailsDto: UpdateBidDto,
        @AuthUser() user: Users,
    ) { 
        return this.bidService.updateBidDetails(bidDetailsDto, id, user.id);
    }

    @ApiBearerAuth()
    @Get('/bids/all')
    @UseGuards(RoleGuard(ROLES.BIDDER, ROLES.COMPANY_ADMIN))
    public getLoggedinBiddersBids(
        @AuthUser() user: Users,
        @Query("search") search: string,
        @Query("profile") profile: string,
        @Query("page") page: number = 1,
        @Query("bidder") bidder: string,
        @Query("type") type: BID_TYPES,
        @Query("startDate") startDate: any,
        @Query("endDate") endDate: any,
        @Query("perPage") perPage: string,
        @Query("leadType") leadType: string,
        @Query("slug") slug: string,
    ) {
        const dates: DateProps = {
            startDate: ['undefined', undefined, null].includes(startDate) ? undefined : moment(startDate).toISOString(),
            endDate: ['undefined', undefined, null].includes(endDate) ? undefined : moment(endDate).toISOString()
        }
        return this.bidJobAccountService.getBiddersBidOrAdminBids(user, search, profile?.split(','), page, bidder?.split(','), type, dates, perPage, leadType?.split(','), slug)
    }

    @ApiBearerAuth()
    @Get('/bids')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
    public getAllBids() {
        return this.bidService.getAllBids()
    }

    @ApiBearerAuth()
    @Get('/bids/:id')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
    public getBidById(
        @AuthUser() user: Users,
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.bidService.getBidById(user.companyId, id)
    }

    @ApiBearerAuth()
    @Get('/bidder/bids/count')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER, ROLES.MANAGER))
    public countBidsOfAllMonths(
        @AuthUser() user: Users,
        @Query("timeZone") timeZone: string = 'UTC',
        @Query("startDate") startDate: any,
        @Query("endDate") endDate: any,
        @Query("bidderId") bidderId?: string,
    ) {
        const dates: DateProps = {
            startDate: ['undefined', undefined, null].includes(startDate) ? moment('1970-01-01').toISOString() : moment(startDate).tz(timeZone).toISOString(),
            endDate: ['undefined', undefined, null].includes(endDate) ? moment().toISOString() : moment(endDate).tz(timeZone).toISOString()
        }
        return this.bidJobAccountService.countBiddersBids(
            user,
            timeZone,
            dates,
            bidderId,
        )
    }

    @ApiBearerAuth()
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.BIDDER))
    @Put('/bids/resync/:bidId')
    public resyncBid(
        @Param('bidId', new ParseUUIDPipe()) bidId: string,
        @Body('type') type: INTEGRATION_TYPES,
        @AuthUser() user: Users,
    ) {
        return this.bidService.resyncBid(user, bidId, type);
    }


}
