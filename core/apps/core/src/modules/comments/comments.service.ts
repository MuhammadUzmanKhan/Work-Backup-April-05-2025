import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, Sequelize } from 'sequelize';
import {
  Comment,
  Department,
  Image,
  User,
} from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ConfigService } from '@nestjs/config';
import {
  CommentableTypes,
  ERRORS,
  Options,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  calculatePagination,
  getPageAndPageSize,
  isEventExist,
} from '@ontrack-tech-group/common/helpers';
import {
  CommentsQueryParamsDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly pusherService: PusherService,
    private readonly configService: ConfigService,
  ) {}

  public async createComment(body: CreateCommentDto, user: User) {
    const { event_id, commentable_id, commentable_type } = body;
    const comment = await Comment.create(
      {
        ...body,
        creator_id: user.id,
        creator_type: commentable_type,
      },
      { raw: true },
    );

    const data = (
      await this.getCommentById(comment.id, user, { useMaster: true })
    )?.get({
      plain: true,
    });

    const count = await Comment.count({
      where: {
        event_id,
        commentable_id,
      },
      useMaster: true,
    });

    data.count = count;

    this.pusherService.sendUpdatedComment(
      data,
      comment.commentable_type,
      comment.commentable_id,
      comment.event_id,
    );

    return { message: 'Comment Created Successfully' };
  }

  public async getCommentById(id: number, user: User, options?: Options) {
    const comment = await Comment.findOne({
      where: { id },
      attributes: [
        'id',
        'commentable_id',
        'commentable_type',
        'text',
        'creator_id',
        'creator_type',
        'event_id',
        'created_at',
        'updated_at',
        'is_edited',
        [Sequelize.literal(`"created_by"."name"`), 'commented_by'],
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
              )`),
              'type',
            ],
          ],
          include: [{ model: Image, attributes: [] }],
        },
      ],
      subQuery: false,
      ...options,
    });

    if (!comment) throw new NotFoundException(RESPONSES.notFound('Comment'));

    return comment;
  }

  public async commentsList(query: CommentsQueryParamsDto, user: User) {
    const { page, page_size, id, event_id, type, keyword } = query;
    if (type === CommentableTypes.USER) {
      const userData = await User.findByPk(id);
      if (!userData)
        throw new ForbiddenException(ERRORS.DATA_NOT_FOUND_AGAINST_GIVEN_ID);
    }

    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    let where = {
      commentable_type: type,
      event_id: event_id,
    };

    if (id) where['commentable_id'] = id;
    if (keyword)
      where = { ...where, ...{ text: { [Op.iLike]: `%${keyword}%` } } };

    const { company_id } = await isEventExist(event_id);

    const comments = await Comment.findAndCountAll({
      where,
      attributes: [
        'id',
        'commentable_id',
        'commentable_type',
        'text',
        'creator_id',
        'creator_type',
        'event_id',
        'created_at',
        'is_edited',
        [Sequelize.literal(`"created_by"."name"`), 'commented_by'],
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
            WHERE "ucr"."user_id" = "Comment"."creator_id"
            AND (
              "ucr"."role_id" IN (0, 28)
              OR "ucr"."company_id" = ${company_id}
            )
            LIMIT 1
          )`),
          'creator_role',
        ],
        [
          Sequelize.literal(`"created_by->department"."name"`),
          'department_name',
        ],
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
              )`),
              'type',
            ],
          ],
          include: [
            { model: Image, attributes: [] },
            {
              model: Department,
              where: { company_id },
              attributes: [],
            },
          ],
        },
      ],
      subQuery: false,
      order: [['createdAt', SortBy.DESC]],
      limit: _page_size || parseInt(this.configService.get('PAGE_LIMIT')),
      offset: _page_size * _page || parseInt(this.configService.get('PAGE')),
      distinct: true,
    });

    const { rows, count } = comments;

    return {
      data: rows.map((row) => row.get({ plain: true })),
      pagination: calculatePagination(count, page_size, page),
    };
  }

  async updateComment(id: number, updateComment: UpdateCommentDto, user: User) {
    const { text } = updateComment;
    const comment = await this.getCommentById(id, user);

    await comment.update({
      text,
      is_edited: true,
    });

    return await this.getCommentById(id, user, { useMaster: true });
  }
}
