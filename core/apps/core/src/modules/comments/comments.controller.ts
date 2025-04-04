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
import { User } from '@ontrack-tech-group/common/models';
import {
  AuthUser,
  RolePermissions,
} from '@ontrack-tech-group/common/decorators';
import {
  COMPANY_ID_API_HEADER,
  UserAccess,
} from '@ontrack-tech-group/common/constants';
import { RolePermissionGuard } from '@ontrack-tech-group/common/services';
import { PathParamIdDto } from '@ontrack-tech-group/common/dto';
import {
  CommentsQueryParamsDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto';
import { CommentsService } from './comments.service';

@ApiTags('Comments')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: 'Create a comment' })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMMENT_ADD_COMMENT)
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
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMMENT_VIEW_COMMENTS)
  @Get()
  commentsList(@Query() query: CommentsQueryParamsDto, @AuthUser() user: User) {
    return this.commentsService.commentsList(query, user);
  }

  @ApiOperation({
    summary:
      'Update a specific comment of LostAndFound, Inventory, Incident, Reservation or User',
  })
  @UseGuards(RolePermissionGuard)
  @RolePermissions(UserAccess.COMMENT_UPDATE)
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
