import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DealLogsService } from './deal-logs.service';
import { CreateDealLogDto } from './dto/create-deal-log.dto';
import { Users } from 'src/common/models/users.model';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('logs')
export class DealLogsController {
    constructor(private readonly dealLogsService: DealLogsService) { }

    @ApiBearerAuth()
    @Post()
    public createDealLog(
        @AuthUser() user: Users,
        @Body() createDealLogDto: CreateDealLogDto,
    ) {
        return this.dealLogsService.createDealLog(user.id, createDealLogDto);
    }

    @ApiBearerAuth()
    @Get("/")
    public getAllDealLogs(
        @Query("bidId") bidId: string,
        @Query("contactId") contactId: string
    ) {
        return this.dealLogsService.getAllLogs(
            bidId,
            contactId
        );
    }
}
