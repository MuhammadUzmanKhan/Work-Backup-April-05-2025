import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TagService } from './tags.service';
import { Source } from 'src/types/enum';
import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
import { Users } from 'src/common/models/users.model';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('tags')
export class TagController {
    constructor(private readonly tagService: TagService) { }

    @ApiBearerAuth()
    @Post('/create')
    public createTags(
        @AuthUser() user: Users,
        @Body() tags: string[],
    ) {
        return this.tagService.createTags(tags, Source.CUSTOM, user.companyId);
    }

    @ApiBearerAuth()
    @Get('/')
    public getAllTags(
        @AuthUser() user: Users,
        @Query('search') search: string,
        @Query('page') page: number,
        @Query('tags') theTags: any,
    ) {
        return this.tagService.getAllTags(user.companyId, search, theTags, page);
    }

}