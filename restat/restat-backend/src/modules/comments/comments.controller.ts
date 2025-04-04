import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Comments } from 'src/common/models/comments.model';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @ApiBearerAuth()
    @Post()
    async createComment(@Body() createCommentDto: CreateCommentDto): Promise<{
        message: string;
        comment: Comments;
    }> {
        return this.commentsService.createComment(createCommentDto);
    }

    @ApiBearerAuth()
    @Get('bid')
    async getCommentsByBidId(@Query('bidId') bidId: string): Promise<{
        message: string;
        comments: Comments[];
    }> {
        return this.commentsService.getCommentsByBidId(bidId);
    }
}
