import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateDealLogDto } from './dto/create-deal-log.dto';
import { DealLogs } from 'src/common/models/deal-logs.model';
import { Users } from 'src/common/models/users.model';
import { CreateAccountLogDto } from './dto/create-account-log.dto';
import { logsMessages } from 'src/common/constants/messages';
// import { Bids } from 'src/common/models/bids.model';

@Injectable()
export class DealLogsService {
    constructor() { }

    public async createDealLog(
        userId: string,
        createDealLogDto: CreateDealLogDto
    ) {
        const dealLog = await DealLogs.create({
            dealLogType: createDealLogDto.dealLogType,
            bidId: createDealLogDto.bidId,
            userId: userId,
            message: createDealLogDto.message,
        });

        if (!dealLog) throw new InternalServerErrorException();

        return {
            message: logsMessages.dealLogCreated,
            dealLog: dealLog,
        };
    }

    public async createAccountLog(createAccountLogDto: CreateAccountLogDto) {
        const dealLog = await DealLogs.create({
            ...createAccountLogDto,
            dealLogType: createAccountLogDto.contactLogType
        });

        return {
            message: logsMessages.accountLogCreated,
            dealLog: dealLog,
        };
    }

    public async getAllLogs(bidId: string, contactId: string) {
        if (bidId) {
            const dealLogs = await DealLogs.findAll({
                where: {
                    bidId,
                },
                include: [{
                    model: Users,
                    attributes: ["id", "name", "email", "deletedAt"],
                    paranoid: false,
                }],
                order: [['createdAt', 'ASC']]
            });

            if (!dealLogs) throw new NotFoundException("No deal logs found");

            return {
                message: logsMessages.allLogsFetched,
                dealLogs,
            };
        }

        if (contactId) {
            const accountLogs = await DealLogs.findAll({
                where: {
                    contactId,
                },
                include: [{
                    model: Users,
                    attributes: ["id", "name", "email", "deletedAt"],
                    paranoid: false,
                }],
                order: [['createdAt', 'ASC']]
            });

            if (!accountLogs) throw new NotFoundException("No Account logs found");

            return {
                message: logsMessages.allLogsFetched,
                accountLogs,
            };
        }
    }
}
