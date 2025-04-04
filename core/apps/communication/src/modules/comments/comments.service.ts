import { Includeable, Op, Sequelize } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Comment,
  CommentMention,
  Department,
  Event,
  Image,
  User,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  CommentableTypes,
  Options,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  decryptData,
  calculatePagination,
  getPageAndPageSize,
  isEventExist,
  isUserExist,
} from '@ontrack-tech-group/common/helpers';
import {
  CommentsQueryParamsDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto';
import { commentListWhere, commonAttributes, commonQueries } from './helpers';

@Injectable()
export class CommentsService {
  constructor(private readonly pusherService: PusherService) {}

  async createComment(body: string | CreateCommentDto, user: User) {
    if (typeof body == 'string') {
      body = decryptData(body) as unknown as CreateCommentDto;
      user = decryptData(user) as unknown as User;
    }
    const { event_id, user_ids } = body;

    let companyId = null;

    if (event_id) {
      const event = await isEventExist(event_id);
      companyId = event.company_id;
    }
    const comment = await Comment.create(
      {
        ...body,
        creator_id: user.id,
        creator_type: 'User',
      },
      { raw: true },
    );

    if (user_ids?.length) {
      const commentMention = user_ids.map((user_id) => ({
        comment_id: comment.id,
        user_id,
      }));

      await CommentMention.bulkCreate(commentMention);
    }

    const data = (
      await this.getCommentById(comment.id, user, companyId, {
        useMaster: true,
      })
    )?.get({
      plain: true,
    });

    this.pusherService.sendUpdatedComment(
      { ...data, isNew: true },
      comment.commentable_type,
      comment.commentable_id,
      comment.event_id,
    );

    return data;
  }

  async getCommentById(
    id: number,
    user: User,
    company_id?: number,
    options?: Options,
  ) {
    const include: Includeable[] = [{ model: Image, attributes: [] }];

    if (company_id) {
      include.push({
        model: Department,
        where: { company_id },
        attributes: [],
        required: false,
      });
    }

    return await Comment.findOne({
      where: { id },
      attributes: [...commonAttributes, ...commonQueries(company_id)],
      include: [
        {
          model: User,
          as: 'created_by',
          attributes: [
            'id',
            'name',
            'cell',
            [
              Sequelize.literal(`"created_by->images"."url"`),
              'commentor_image',
            ],
            [
              Sequelize.literal(`(
                SELECT
                  CASE
                    WHEN "ucr"."role_id" = 0 THEN 'super_admin'
                    WHEN "ucr"."role_id" = 28 THEN 'ontrack_manager'
                    ELSE "roles"."name"
                  END AS "name"
                FROM "roles"
                INNER JOIN "users_companies_roles" AS "ucr" ON "roles".id = "ucr"."role_id"
                WHERE "ucr"."user_id" = "created_by"."id"
                AND (
                  "ucr"."role_id" IN (0, 28)
                  OR "ucr"."company_id" = ${user['company_id']}
                )
              )`),
              'type',
            ],
          ],
          include,
        },
      ],
      subQuery: false,
      ...options,
    });
  }

  async commentsList(query: string | CommentsQueryParamsDto, user: User) {
    if (typeof query == 'string') {
      query = decryptData(query) as unknown as CommentsQueryParamsDto;
      user = decryptData(user) as unknown as User;
    }

    let event: Event;
    const { id, event_id, type, page, page_size, comment_id } = query;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);
    let timeStamp: string;

    if (event_id) {
      event = await isEventExist(event_id);
    }

    if (type === CommentableTypes.USER) {
      await isUserExist(id);
    }

    if (comment_id) {
      const targetComment = (
        await Comment.findOne({
          where: { id: comment_id },
          attributes: ['created_at'],
        })
      ).get({ plain: true });

      if (!targetComment) {
        throw new NotFoundException('Comment Not Found');
      }

      timeStamp = targetComment['created_at'];
    }

    const comments = await Comment.findAndCountAll({
      where: commentListWhere(query, timeStamp),
      attributes: ['id', 'created_at'],
      include: [
        {
          model: User,
          as: 'created_by',
          attributes: [],
          include: [
            { model: Image, attributes: [] },
            {
              model: Department,
              where: {
                company_id: event?.company_id ? event?.company_id : null,
              },
              attributes: [],
              required: false,
            },
          ],
        },
      ],
      order: [['created_at', SortBy.DESC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
      distinct: true,
    });

    const { rows, count } = comments;

    const commentIds = rows.map((comment) => comment.id);

    const allComments = await Comment.findAll({
      where: { id: { [Op.in]: commentIds } },
      attributes: [
        ...commonAttributes,
        ...(event?.company_id ? commonQueries(event?.company_id) : []),
      ],
      include: [
        {
          model: User,
          as: 'created_by',
          attributes: [
            'id',
            'name',
            'cell',
            [
              Sequelize.literal(`"created_by->images"."url"`),
              'commentor_image',
            ],
            [
              Sequelize.literal(`(
                SELECT
                  CASE
                    WHEN "ucr"."role_id" = 0 THEN 'super_admin'
                    WHEN "ucr"."role_id" = 28 THEN 'ontrack_manager'
                    ELSE "roles"."name"
                  END AS "name"
                FROM "roles"
                INNER JOIN "users_companies_roles" AS "ucr" ON "roles".id = "ucr"."role_id"
                WHERE "ucr"."user_id" = "created_by"."id"
                AND (
                  "ucr"."role_id" IN (0, 28)
                  OR "ucr"."company_id" = ${user['company_id']}
                )
                LIMIT 1
              )`),
              'type',
            ],
          ],
          include: [
            { model: Image, attributes: [] },
            {
              model: Department,
              where: {
                company_id: event?.company_id ? event?.company_id : null,
              },
              attributes: [],
              required: false,
            },
          ],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
    });

    return {
      data: allComments.map((row) => row.get({ plain: true })),
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async updateComment(id: number, updateComment: UpdateCommentDto, user: User) {
    const { text } = updateComment;
    const comment = await this.getCommentById(id, user);

    let companyId = null;

    if (comment.event_id) {
      const event = await isEventExist(comment.event_id);
      companyId = event.company_id;
    }

    await comment.update({
      text,
      is_edited: true,
    });

    const updatedComment = (
      await this.getCommentById(id, user, companyId, { useMaster: true })
    ).get({
      plain: true,
    });

    this.pusherService.sendUpdatedComment(
      { ...updatedComment, isNew: false },
      comment.commentable_type,
      comment.commentable_id,
      comment.event_id,
    );

    return updatedComment;
  }
}
