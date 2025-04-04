import {
  BulkCreateOptions,
  CreateOptions,
  DestroyOptions,
  Op,
  Sequelize,
  Transaction,
} from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PolymorphicType,
  SortBy,
  ERRORS,
  Options,
  Editor,
} from '@ontrack-tech-group/common/constants';
import { Image, User } from '@ontrack-tech-group/common/models';
import { PusherService } from '@ontrack-tech-group/common/services';
import { CreateBulkImageDto } from './dto/create-bulk-image-dto';

@Injectable()
export class ImageService {
  constructor(private readonly pusherService: PusherService) {}

  /**
   * @param id
   * @param type
   * @param url
   * @param name
   * @param capture_at
   * @returns
   * This function is used to create any attachments like image, pdf, etc.
   * We are using name as Image because DB table name is Image. And we can't change it and using same table in our case.
   */
  public async createImage(
    id: number,
    type: PolymorphicType,
    url: string,
    name?: string,
    user_id?: number,
    user_name?: string,
  ) {
    const image = await Image.create(
      {
        name,
        url,
        imageable_id: id,
        imageable_type: type,
        creator_id: user_id,
      },
      {
        returning: true,
        editor:
          user_id && user_name
            ? { editor_id: user_id, editor_name: user_name }
            : null,
      } as CreateOptions & { editor: Editor },
    );

    const updatedImage = await this.getImageById(image.id, { useMaster: true });

    this.pusherService.sendUpdatedAttachment(updatedImage, type, id);

    return updatedImage;
  }

  // for saving bulk images in db
  public async createBulkImage(
    images: CreateBulkImageDto[],
    user?: User,
    transaction?: Transaction,
  ) {
    await Image.bulkCreate(
      images as any[],
      {
        transaction,
        editor: {
          editor_id: user.id,
          editor_name: user.name,
        },
      } as BulkCreateOptions & { editor: Editor },
    );
  }

  public async getImages(id: number, type: string) {
    if (!id || isNaN(id)) return;

    return await Image.findAll({
      where: { imageable_id: id, imageable_type: type },
      attributes: [
        'id',
        'name',
        'url',
        'createdAt',
        'thumbnail',
        [Sequelize.literal(`"created_by"."name"`), 'createdBy'],
      ],
      include: [
        {
          model: User,
          as: 'created_by',
          attributes: [],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
    });
  }

  public async getImageById(id: number, options?: Options) {
    return await Image.findByPk(id, {
      attributes: [
        'id',
        'name',
        'url',
        'createdAt',
        'thumbnail',
        [Sequelize.literal(`"created_by"."name"`), 'createdBy'],
      ],
      include: [
        {
          model: User,
          as: 'created_by',
          attributes: [],
        },
      ],
      order: [['createdAt', SortBy.DESC]],
      ...options,
    });
  }

  public async deleteImage(id: number, user?: User, transaction?: Transaction) {
    const image = await (await this.getImageById(id)).get({ plain: true });
    if (!image) throw new NotFoundException(ERRORS.ATTACHMENT_NOT_FOUND);

    await Image.destroy({
      where: { id },
      transaction,
      individualHooks: true,
      editor: user
        ? {
            editor_id: user.id,
            editor_name: user.name,
          }
        : null,
    } as DestroyOptions & { editor: Editor });

    return image;
  }

  // deleting multple images
  public async deleteMultipleImages(ids: number[], transaction?: Transaction) {
    await Image.destroy({
      where: { id: { [Op.in]: ids } },
      transaction,
    });
  }
}
