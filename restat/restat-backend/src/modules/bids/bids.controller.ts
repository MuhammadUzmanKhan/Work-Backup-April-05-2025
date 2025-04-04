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
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
    public updateBidDetails(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() bidDetailsDto: UpdateBidDto,
        @AuthUser() user: Users,
    ) {
        return this.bidService.updateBidDetails(bidDetailsDto, id, user.id);
    }

    @ApiBearerAuth()
    @Get('/bids/all')
    @UseGuards(RoleGuard(ROLES.BIDDER, ROLES.COMPANY_ADMIN, ROLES.OWNER))
    @ApiBearerAuth()
    @Get('/bids/all')
    @UseGuards(RoleGuard(ROLES.BIDDER, ROLES.COMPANY_ADMIN, ROLES.OWNER))
    public getLoggedinBiddersBids(
        @AuthUser() user: Users,
        @Query("search") search: string,
        @Query("profile") profile: string,
        @Query("page") page: number = 1,
        @Query("bidder") bidder: string,
        @Query("status") status: string = BID_TYPES.ALL,
        @Query("startDate") startDate: any,
        @Query("endDate") endDate: any,
        @Query("perPage") perPage: string = '20',
        @Query("type") type: string,
        @Query("slug") slug: string,
        @Query("clientBudgetMin") clientBudgetMin: number,
        @Query("clientBudgetMax") clientBudgetMax: number,
        @Query("proposedRate") proposedRate: number,
        @Query("receivedRate") receivedRate: number,
        @Query("leadStartDate") leadStartDate: any,
        @Query("leadEndDate") leadEndDate: any,
        @Query("proposalStartDate") proposalStartDate: any,
        @Query("proposalEndDate") proposalEndDate: any,
        @Query("contractStartDate") contractStartDate: any,
        @Query("contractEndDate") contractEndDate: any,
        @Query("location") location: string,
        @Query("skillset") skillset: string
    ) {
        const dates: DateProps = {
            startDate: ['undefined', undefined, null].includes(startDate) ? undefined : moment(startDate).toISOString(),
            endDate: ['undefined', undefined, null].includes(endDate) ? undefined : moment(endDate).toISOString(),
            leadStartDate: leadStartDate ? moment(leadStartDate).startOf('day').toISOString() : undefined,
            leadEndDate: leadEndDate ? moment(leadEndDate).endOf('day').toISOString() : undefined,
            proposalStartDate: proposalStartDate ? moment(proposalStartDate).startOf('day').toISOString() : undefined,
            proposalEndDate: proposalEndDate ? moment(proposalEndDate).endOf('day').toISOString() : undefined,
            contractStartDate: contractStartDate ? moment(contractStartDate).startOf('day').toISOString() : undefined,
            contractEndDate: contractEndDate ? moment(contractEndDate).endOf('day').toISOString() : undefined,
        };

        const hourlyRange = clientBudgetMin && clientBudgetMax ? [clientBudgetMin, clientBudgetMax] : [];

        const filters = {
            user,
            search,
            profile: profile?.split(','),
            page,
            bidderId: bidder?.split(','),
            status: status ? status?.split(',') : [],
            dates,
            perPage,
            type: type ? type?.split(',') : [],
            slug,
            hourlyRange,
            proposedRate,
            receivedRate,
            location: location ? location?.split(',') : [],
            skillSet: skillset ? skillset?.split(',') : [],
        }

        return this.bidJobAccountService.getBiddersBidOrAdminBids(filters);
    }


    @ApiBearerAuth()
    @Get('/bids')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
    public getAllBids() {
        return this.bidService.getAllBids()
    }

    @ApiBearerAuth()
    @Get('/bids/:id')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER))
    public getBidById(
        @AuthUser() user: Users,
        @Param('id', new ParseUUIDPipe()) id: string,
    ) {
        return this.bidService.getBidById(user.companyId, id)
    }

    @ApiBearerAuth()
    @Get('/bidder/bids/count')
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
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
    @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
    @Put('/bids/resync/:bidId')
    public resyncBid(
        @Param('bidId', new ParseUUIDPipe()) bidId: string,
        @Body('type') type: INTEGRATION_TYPES,
        @AuthUser() user: Users,
    ) {
        return this.bidService.resyncBid(user, bidId, type);
    }


}
