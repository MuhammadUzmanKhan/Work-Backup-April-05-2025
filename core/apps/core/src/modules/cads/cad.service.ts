import { Sequelize } from 'sequelize-typescript';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Options,
  PolymorphicType,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import { Cad, CadType, Image, User } from '@ontrack-tech-group/common/models';
import {
  withCompanyScope,
  throwCatchError,
  withTryCatch,
} from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import { ImageService } from '@Modules/image/image.service';
import { isCadTypeIdExists } from '@Modules/cad-types/helpers';
import { _MESSAGES, SocketTypes } from '@Common/constants';
import { CreateCadDto, UpdateCadDto } from './dto';
import { cadDeleteSocket } from './helpers';

@Injectable()
export class CadService {
  constructor(
    private readonly imageService: ImageService,
    private readonly sequelize: Sequelize,
    private readonly pusherService: PusherService,
  ) {}

  async createCad(user: User, createCadDto: CreateCadDto) {
    let cad: Cad;
    const { event_id, image_url, image_name, cad_type_id } = createCadDto;

    // Check if event exists
    await withCompanyScope(user, event_id);

    // Check if the provided cad_type_id exist
    await isCadTypeIdExists(cad_type_id);

    const transaction = await this.sequelize.transaction();

    try {
      cad = await Cad.create(
        {
          ...createCadDto,
          updated_by: user.id,
          updated_by_name: user.name,
        },
        { transaction },
      );

      // Handle image creation if image data is provided
      await this.imageService.createImage(
        cad.id,
        PolymorphicType.CAD,
        image_url,
        image_name,
        user.id,
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    cad = await this.getCadById(cad.id, null, { useMaster: true });

    try {
      this.pusherService.sendCadUpdate(cad, event_id, cad.id);
    } catch (err) {
      console.log(err);
    }

    return cad;
  }

  async getCadById(id: number, user?: User, options?: Options) {
    const cad = await Cad.findOne({
      where: {
        id,
      },
      attributes: {
        exclude: ['updated_by'],
        include: [
          [Sequelize.literal('"images"."name"'), 'image_name'],
          [Sequelize.literal('"images"."url"'), 'image_url'],
        ],
      },
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: CadType,
          attributes: [
            [Sequelize.cast(Sequelize.col('"cad_type"."id"'), 'integer'), 'id'],
            'name',
          ],
        },
      ],
      ...options,
    });
    if (!cad) {
      throw new NotFoundException(RESPONSES.notFound('Cad'));
    }

    if (user) {
      // Check if the user has access to the event
      await withCompanyScope(user, cad.event_id);
    }

    return cad;
  }

  async getAllCads(event_id: number, user: User) {
    // Check if the user has access to the event
    await withCompanyScope(user, event_id);

    // Query all CADs related to the specific event
    return await Cad.findAll({
      where: {
        event_id,
      },
      attributes: {
        exclude: ['updated_by', 'cad_type_id'],
        include: [
          [Sequelize.literal('"images"."name"'), 'image_name'],
          [Sequelize.literal('"images"."url"'), 'image_url'],
        ],
      },
      include: [
        {
          model: Image,
          attributes: [],
        },
        {
          model: CadType,
          attributes: [
            [Sequelize.cast(Sequelize.col('"cad_type"."id"'), 'integer'), 'id'],
            'name',
          ],
        },
      ],
      order: [[Sequelize.literal('"Cad"."created_at"'), 'DESC']],
    });
  }

  async updateCad(id: number, updateCadDto: UpdateCadDto, user: User) {
    // Destructure fields from the DTO
    const { image_url, image_name, event_id, cad_type_id } = updateCadDto;

    // checking if cad exists or not
    await this.getCadById(id);

    // Ensure the user has access to the event
    await withCompanyScope(user, event_id);

    if (cad_type_id) {
      // Check if the provided cad_type_id exist
      await isCadTypeIdExists(cad_type_id);
    }

    const transaction = await this.sequelize.transaction();

    try {
      await Cad.update(updateCadDto, {
        where: { id, event_id },
        transaction,
      });

      // Update the associated image if necessary, using the correct column name
      if (image_url || image_name) {
        await Image.update(
          {
            url: image_url,
            name: image_name,
          },
          {
            where: { imageable_id: id, imageable_type: PolymorphicType.CAD },
            transaction,
          },
        );
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedCad = await this.getCadById(id, null, { useMaster: true });

    try {
      this.pusherService.sendCadUpdate(updatedCad, event_id, updatedCad.id);
    } catch (err) {
      console.log(err);
    }

    return updatedCad;
  }

  async updateCadActive(id: number, user: User) {
    // checking if cad exists or not
    const cad = await this.getCadById(id);

    // Ensure the user has access to the event
    await withCompanyScope(user, cad.event_id);

    //Make passed id active
    await Cad.update(
      {
        active: !cad.active,
      },
      {
        where: { id },
      },
    );

    const updatedCad = await this.getCadById(id, null, { useMaster: true });

    try {
      this.pusherService.sendCadUpdate(updatedCad, cad.event_id, updatedCad.id);
    } catch (err) {
      console.log(err);
    }

    return updatedCad;
  }

  async deleteCad(id: number, user: User) {
    // checking if cad exists or not
    const cad = await this.getCadById(id);

    await withCompanyScope(user, cad.event_id);

    const transaction = await this.sequelize.transaction();

    try {
      // Delete associated image
      await Image.destroy({
        where: { imageable_id: id, imageable_type: PolymorphicType.CAD },
        transaction,
      });

      await cad.destroy({ transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throwCatchError(err);
    }

    withTryCatch(
      () => {
        cadDeleteSocket(
          id,
          cad.event_id,
          this.pusherService,
          SocketTypes.DELETE_CAD,
          'Cad deleted successfully',
        );
      },
      'deleteCad',
      'sendDeleteCad',
    );

    return { message: RESPONSES.destroyedSuccessfully('Cad Type') };
  }
}
