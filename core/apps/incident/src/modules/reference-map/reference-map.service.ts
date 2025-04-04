import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Image, ReferenceMap, User } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  MESSAGES,
  Options,
  PolymorphicType,
} from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import {
  isEventExist,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { CloneDto } from '@Common/dto';
import { SocketTypes, _ERRORS } from '@Common/constants';
import {
  BulkDeleteUpdateReferenceMapDto,
  CreateReferenceMapDto,
  ReferenceMapDto,
  UpdateReferenceMapDto,
} from './dto';
import {
  sendUpdatedRefrenceMap,
  referenceMapWhere,
  referenceMapAttributes,
} from './helpers';

@Injectable()
export class ReferenceMapService {
  constructor(
    private sequelize: Sequelize,
    private pusherService: PusherService,
  ) {}

  async createReferenceMap(
    user: User,
    createReferenceMapDto: CreateReferenceMapDto,
  ) {
    const { image, name, event_id } = createReferenceMapDto;
    const transaction = await this.sequelize.transaction();
    let newVersion: number;
    let newReferenceMap;

    await isEventExist(event_id);

    const existingCad = await ReferenceMap.findOne({
      attributes: ['version'],
      where: {
        event_id,
      },
      order: [['version', 'DESC']],
      raw: true,
    });

    if (existingCad) {
      newVersion = parseFloat((existingCad.version + 0.1).toFixed(1));
    } else {
      newReferenceMap = {
        version: 1.0,
        current_version: true,
      };
    }

    try {
      // Attempt to create a reference map with the provided event_id and name
      const createdReferenceMap = await ReferenceMap.create(
        {
          event_id,
          name,
          version: newVersion,
          current_version: false,
          creator_id: user.id,
          ...newReferenceMap,
        },
        { transaction },
      );

      // Check if an image is provided
      if (image) {
        // If an image is provided, create an image record associated with the reference map
        await Image.create(
          {
            imageable_id: createdReferenceMap.id,
            imageable_type: PolymorphicType.REFERENCE_MAP,
            url: image,
          },
          { transaction },
        );
      }

      // Commit the transaction, saving the changes to the database
      await transaction.commit();

      const createdRefrenceMap = await this.getReferenceMapById(
        createdReferenceMap.id,
        event_id,
        { useMaster: true },
      );

      sendUpdatedRefrenceMap(
        { refrenceMap: createdRefrenceMap },
        event_id,
        'new',
        SocketTypes.REFRENCE_MAP,
        true,
        this.pusherService,
      );

      // Retrieve and return the newly created reference map by its ID
      return createdRefrenceMap;
    } catch (error) {
      // If an error occurs during the transaction, rollback the changes
      await transaction.rollback();

      // Throw a custom InternalServerErrorException with an error message
      throw new InternalServerErrorException(ERRORS.SOMETHING_WENT_WRONG);
    }
  }

  async cloneReferenceMap(user: User, clone_ref_map: CloneDto) {
    const { clone_event_id, current_event_id } = clone_ref_map;

    const referenceMaps = await ReferenceMap.findAll({
      where: { event_id: clone_event_id },
    });

    if (!referenceMaps)
      throw new NotFoundException(_ERRORS.EVENT_CAMERA_NOT_FOUND);

    for (const referenceMap of referenceMaps) {
      const image = await Image.findOne({
        where: {
          imageable_id: referenceMap.id,
          imageable_type: PolymorphicType.REFERENCE_MAP,
        },
      });
      const body = {
        name: referenceMap.name,
        image: image.url,
        event_id: current_event_id,
      };

      await this.createReferenceMap(user, body);
    }

    sendUpdatedRefrenceMap(
      { message: 'Reference Map Cloned Successfully' },
      current_event_id,
      'clone',
      SocketTypes.REFRENCE_MAP,
      true,
      this.pusherService,
    );

    return { message: 'Reference Map Cloned Successfully' };
  }

  async getAllReferenceMaps(refMapDto: ReferenceMapDto) {
    const { event_id } = refMapDto;

    return await ReferenceMap.findAll({
      where: referenceMapWhere(refMapDto),
      attributes: referenceMapAttributes(event_id),
      include: [
        {
          model: Image,
          attributes: [],
        },
      ],
      group: [`"ReferenceMap"."id"`, 'reference_map_image.url'],
      order: [['created_at', 'DESC']],
    });
  }

  async getReferenceMapById(id: number, event_id: number, options?: Options) {
    const referenceMap = await ReferenceMap.findOne({
      where: { id, event_id },
      attributes: {
        include: [
          'created_at',
          'updated_at',
          [Sequelize.literal('"reference_map_image"."url"'), 'url'],
          [
            Sequelize.literal(
              `(SELECT "version" FROM "reference_maps" WHERE "event_id" = ${event_id} ORDER BY "created_at" DESC LIMIT 1)`,
            ),
            'latest_version',
          ],
          [
            Sequelize.literal(
              `(SELECT "name" FROM "users" WHERE "id" = "ReferenceMap"."creator_id")`,
            ),
            'creator_name',
          ],
        ],
        exclude: ['createdAt', 'updatedAt'],
      },
      include: [
        {
          model: Image,
          attributes: [],
        },
      ],
      ...options,
    });
    if (!referenceMap)
      throw new NotFoundException(ERRORS.REFERENCE_MAP_NOT_FOUND);

    return referenceMap;
  }

  async updateReferenceMap(
    id: number,
    updateReferenceMapDto: UpdateReferenceMapDto,
  ) {
    const { event_id, image, name } = updateReferenceMapDto;
    const transaction = await this.sequelize.transaction();

    await isEventExist(event_id);

    try {
      const referenceMap = await ReferenceMap.findOne({
        where: { id, event_id },
        attributes: ['id'],
        include: [
          {
            model: Image,
            attributes: ['url'],
          },
        ],
      });
      if (!referenceMap)
        throw new NotFoundException(ERRORS.REFERENCE_MAP_NOT_FOUND);

      // updating name of reference map
      await referenceMap.update({ name }, { transaction });

      // Check if an image is provided
      if (image) {
        // if reference map have already image, then updating an existing image
        if (referenceMap.reference_map_image) {
          await Image.update(
            { url: image },
            {
              where: {
                imageable_id: referenceMap.id,
                imageable_type: PolymorphicType.REFERENCE_MAP,
              },
              transaction,
            },
          );
        } else {
          // if reference map have not already image, then creating an image
          await Image.create(
            {
              imageable_id: referenceMap.id,
              imageable_type: PolymorphicType.REFERENCE_MAP,
              url: image,
            },
            { transaction },
          );
        }
      }

      // Commit the transaction, saving the changes to the database
      transaction.commit();
    } catch (err) {
      // If an error occurs during the transaction, rollback the changes
      await transaction.rollback();
      throwCatchError(err);
    }

    const updatedRefrenceMap = await this.getReferenceMapById(id, event_id, {
      useMaster: true,
    });

    sendUpdatedRefrenceMap(
      { refrenceMap: updatedRefrenceMap },
      event_id,
      'update',
      SocketTypes.REFRENCE_MAP,
      false,
      this.pusherService,
    );

    return updatedRefrenceMap;
  }

  async updateCurrentVersion(
    bulkDeleteUpdateReferenceMapDto: BulkDeleteUpdateReferenceMapDto,
    user: User,
  ) {
    const { event_id, reference_map_ids, current_version } =
      bulkDeleteUpdateReferenceMapDto;
    await withCompanyScope(user, event_id);

    const existingReferenceMap = await ReferenceMap.findAll({
      attributes: ['id'],
      where: { id: { [Op.in]: reference_map_ids } },
    });

    if (existingReferenceMap.length !== reference_map_ids.length) {
      throw new NotFoundException(_ERRORS.SOME_OF_REFERENCE_MAPS_ARE_NOT_FOUND);
    }

    await ReferenceMap.update(
      { current_version },
      {
        where: {
          id: { [Op.in]: reference_map_ids },
        },
      },
    );

    const updatedRefrenceMap = await ReferenceMap.findAll({
      where: { id: { [Op.in]: reference_map_ids } },
      attributes: referenceMapAttributes(event_id),
      include: [
        {
          model: Image,
          attributes: [],
        },
      ],
      group: [`"ReferenceMap"."id"`, 'reference_map_image.url'],
      useMaster: true,
    });

    sendUpdatedRefrenceMap(
      { refrenceMap: updatedRefrenceMap },
      event_id,
      'update',
      SocketTypes.REFRENCE_MAP,
      false,
      this.pusherService,
    );

    return updatedRefrenceMap;
  }

  async deleteBulkReferenceMap(
    bulkDeleteReferenceMapDto: BulkDeleteUpdateReferenceMapDto,
  ) {
    const { reference_map_ids, event_id } = bulkDeleteReferenceMapDto;

    const referenceMap = await ReferenceMap.findAll({
      where: {
        id: { [Op.in]: reference_map_ids },
        event_id,
      },
      attributes: ['id', 'current_version'],
    });

    const filteredObjects = referenceMap.filter((obj) => !obj.current_version);

    const _referenceMapIds = filteredObjects.map((item) => Number(item.id));

    for (const id of _referenceMapIds) {
      await ReferenceMap.destroy({
        where: { id },
      });
    }

    sendUpdatedRefrenceMap(
      {
        message: MESSAGES.REFERENCE_MAP_DESTROYED_SUCCESSFULLY,
        deletedIds: _referenceMapIds,
      },
      event_id,
      'delete',
      SocketTypes.REFRENCE_MAP,
      false,
      this.pusherService,
    );

    return { message: MESSAGES.REFERENCE_MAP_DESTROYED_SUCCESSFULLY };
  }

  async deleteReferenceMap(id: number, event_id: number) {
    const referenceMap = await ReferenceMap.findOne({
      where: { id, event_id },
      attributes: ['id', 'current_version'],
    });

    if (referenceMap.current_version)
      throw new UnprocessableEntityException(_ERRORS.CURRENT_VERSION);

    if (!referenceMap)
      throw new NotFoundException(ERRORS.REFERENCE_MAP_NOT_FOUND);

    await referenceMap.destroy();

    sendUpdatedRefrenceMap(
      {
        message: MESSAGES.REFERENCE_MAP_DESTROYED_SUCCESSFULLY,
        deletedIds: [referenceMap.id],
      },
      event_id,
      'delete',
      SocketTypes.REFRENCE_MAP,
      false,
      this.pusherService,
    );

    return {
      message: MESSAGES.REFERENCE_MAP_DESTROYED_SUCCESSFULLY,
    };
  }
}
