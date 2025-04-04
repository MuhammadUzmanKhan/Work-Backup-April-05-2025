import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comments } from 'src/common/models/comments.model';
import { commentsMessages } from 'src/common/constants/messages';

@Injectable()
export class CommentsService {
    constructor() { }

    async createComment({ commentText, bidId, userId }: CreateCommentDto) {

        const comment = await Comments.create({
            commentText,
            bidId,
            userId
        });
        if (!comment) throw new NotFoundException(commentsMessages.commentCreated);

        return {
            message: commentsMessages.commentCreated,
            comment
        }
    }

    async getCommentsByBidId(bidId: string) {

        const comments = await Comments.findAll({ where: { bidId }, include: ['user'] });

        if (!comments) throw new NotFoundException(commentsMessages.allCommentsFetchedError);

        return {
            message: commentsMessages.allCommentsFetched,
            comments
        };
    }
}
