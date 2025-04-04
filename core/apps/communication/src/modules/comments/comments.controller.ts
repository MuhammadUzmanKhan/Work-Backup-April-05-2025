import { Observable, of } from 'rxjs';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MessagePattern } from '@nestjs/microservices';
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { CommentsService } from './comments.service';
import {
  CommentsQueryParamsDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto';

@ApiTags('Comments')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: 'Create a comment' })
  @Post()
  createComment(
    @Body() createCommentDto: CreateCommentDto,
    @AuthUser() user: User,
  ) {
    return this.commentsService.createComment(createCommentDto, user);
  }

  @ApiOperation({
    summary:
      'Return comments on LostAndFound, Inventory, Incident, Reservation or User',
  })
  @Get()
  commentsList(@Query() query: CommentsQueryParamsDto, @AuthUser() user: User) {
    return this.commentsService.commentsList(query, user);
  }

  @MessagePattern('create-comment')
  async createCommentCommunication(data: any): Promise<Observable<any>> {
    const { body, user } = data;

    try {
      const messageGroup = await this.commentsService.createComment(body, user);
      return of(messageGroup);
    } catch (error) {
      return of(error.response);
    }
  }

  @MessagePattern('get-comment-list')
  async getCommentListCommunication(data: any): Promise<Observable<any>> {
    const { body, user } = data;

    try {
      const messageGroup = await this.commentsService.commentsList(body, user);
      return of(messageGroup);
    } catch (error) {
      return of(error.response);
    }
  }

  @ApiOperation({
    summary:
      'Update a specific comment of LostAndFound, Inventory, Incident, Reservation or User',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(
    UserAccess.COMMENT_UPDATE,
    UserAccess.INCIDENT_UPDATE_COMMENT,
  )
  @Put('/:id')
  updateComment(
    @Param() pathParamId: PathParamIdDto,
    @Body() updateCommentDto: UpdateCommentDto,
    @AuthUser() user: User,
  ) {
    return this.commentsService.updateComment(
      pathParamId.id,
      updateCommentDto,
      user,
    );
  }
}
