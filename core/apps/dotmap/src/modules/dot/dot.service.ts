import * as _ from 'lodash';
import { Op, QueryTypes } from 'sequelize';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import {
  DotShift,
  PositionName,
  User,
  DotMapDot,
  BaseDeployment,
  DotMapShift,
} from '@ontrack-tech-group/common/models';
import {
  MESSAGES,
  Options,
  RESPONSES,
  SocketTypesStatus,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  checkIfDuplicateExist,
  getQueryListParam,
  throwCatchError,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import { PusherService } from '@ontrack-tech-group/common/services';
import { _ERRORS, _MESSAGES } from '@Common/constants/responses';
import {
  bulkCreateWithCheck,
  calculateTotalShiftHours,
  getArrayInChunks,
} from '@Common/helpers';
import { ShiftService } from '@Modules/shift/shift.service';
import {
  budgetSummaryhelper,
  getVendorsListByEvent,
  isVendorExist,
  sendBudgetSummarySocket,
} from '@Modules/vendor/helper';
import { DotsGroupBy, SocketTypesModule } from '@Common/constants/enums';
import {
  getAllDotsWhere,
  newBulkDots,
  checkUpdateDotValidations,
  commonExcludeAttributes,
  commonGroupBy,
  commonIncludeAttributes,
  commonIncludes,
  isDotExist,
  sendDotsSocketUpdates,
  dotsResponseForClone,
  createOrUpdateDotShifts,
  getTotalAvgRateOfDot,
  sendPriorityMissingCountUpdates,
  sendCopyDotUpdate,
  copyDotHelper,
  getTotalAvgRateOfBulkDot,
  allDotsExist,
  bulkCreateDotsHelper,
  checkBulkUpdateDotValidations,
  fetchDots,
  sendResetSocketUpdates,
} from './helpers';
import {
  BulkDotsDeleteDto,
  CloneDotDto,
  CopyDotDto,
  GetDotsByEventDto,
  ResetDeploymentDto,
  SwapDotsDto,
  UpdateBulkDotsDto,
  UpdateDotDto,
  UpdateShiftDto,
  UploadDotsDto,
} from './dto';

@Injectable()
export class DotService {
  constructor(
    private sequelize: Sequelize,
    private shiftService: ShiftService,
    private pusherService: PusherService,
  ) {}

  async uploadDots(uploadDotsDto: UploadDotsDto, user: User) {
    const { dots, event_id, file_name: name, url } = uploadDotsDto;

    if (checkIfDuplicateExist(dots, ['pos_id'])) {
      throw new BadRequestException(_ERRORS.DUPLICATE_POSITION_ID);
    }

    const existingPosIdDots = await DotMapDot.findAll({
      where: { pos_id: { [Op.in]: dots.map((dot) => dot.pos_id) }, event_id },
    });

    if (existingPosIdDots.length) {
      throw new ConflictException(
        RESPONSES.alreadyExist('Some Of Position Ids'),
      );
    }

    const transaction = await this.sequelize.transaction();

    try {
      const dotsToBeCreate = await bulkCreateDotsHelper(
        uploadDotsDto,
        user,
        transaction,
        this.shiftService,
      );

      await DotMapDot.bulkCreate(dotsToBeCreate, {
        transaction,
        include: [{ association: 'dot_shifts' }],
      });

      if (name && url) {
        await BaseDeployment.create(
          { event_id, url, name, user_id: user.id },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();

      throwCatchError(error);
    }

    const vendors = await getVendorsListByEvent(event_id, { useMaster: true });

    sendDotsSocketUpdates(
      {
        message: RESPONSES.uploadedSuccessfully('Dots'),
      },
      event_id,
      SocketTypesStatus.UPLOAD,
      SocketTypesModule.DOT,
      true,
      this.pusherService,
    );

    sendPriorityMissingCountUpdates(event_id, this.pusherService);

    return { message: RESPONSES.uploadedSuccessfully('Dots'), vendors };
  }

  async cloneDot(cloneDotDto: CloneDotDto, user: User) {
    const { dot_ids, event_id, quantity } = cloneDotDto;

    // Check if user has access to this event or not based on its company or subcompany
    await withCompanyScope(user, event_id);

    // getting dot as it same as going to create in bulk, Dot data and dot shifts data
    const dots = await DotMapDot.findAll({
      where: { id: { [Op.in]: dot_ids }, event_id },
      attributes: {
        exclude: [
          'id',
          'location',
          'updated_at',
          'created_at',
          'placed',
          'missing',
        ],
      },
      include: [
        {
          model: DotShift,
          attributes: { exclude: ['id', 'dot_id', 'created_at', 'updated_at'] },
          required: false,
        },
      ],
    });

    // Convert Sequelize instances to plain objects
    const plainDots = dots.map((dot) => dot.toJSON());

    if (plainDots.length !== dot_ids.length)
      throw new NotFoundException(RESPONSES.notFound('Some of Dots'));

    const bulkDots = await newBulkDots(plainDots, quantity); // Start with the next available pos_id

    // Bulk create the new dots
    const bulkCreatedDots = await DotMapDot.bulkCreate(bulkDots, {
      include: [{ association: 'dot_shifts' }],
    });

    const _dots = await dotsResponseForClone(
      bulkCreatedDots.map(({ id }) => id),
    );

    const dotsInChunks = getArrayInChunks(_dots, 4);

    for (const dots of dotsInChunks) {
      sendDotsSocketUpdates(
        {
          dots,
          message: _MESSAGES.DOTS_ARE_CLONED_SUCCESSFULLY,
        },
        dots[0].event_id,
        SocketTypesStatus.CLONE,
        SocketTypesModule.DOT,
        true,
        this.pusherService,
      );
    }

    sendBudgetSummarySocket(
      { ...(await budgetSummaryhelper(event_id, { useMaster: true })) },
      event_id,
      SocketTypesStatus.UPDATE,
      SocketTypesModule.SUMMARY,
      false,
      this.pusherService,
    );

    sendPriorityMissingCountUpdates(event_id, this.pusherService);

    return _dots;
  }

  async copyDot(copyDotDto: CopyDotDto, user: User) {
    const { event_id } = copyDotDto;

    // Check if user has access to this event
    const [, , timezone] = await withCompanyScope(user, event_id);

    // Fetch dots and their shifts
    const dots = await DotMapDot.findAll({
      where: { event_id, placed: true },
      attributes: ['id'],
      include: [
        {
          model: DotMapShift,
          attributes: [
            'id',
            'start_date',
            'end_date',
            [Sequelize.literal('"shifts->DotShift"."rate"'), 'rate'],
            [Sequelize.literal('"shifts->DotShift"."dot_id"'), 'dot_id'],
          ],
          required: false,
          through: { attributes: [] },
        },
      ],
      raw: true,
      nest: true,
    });

    if (!dots.length) {
      throw new NotFoundException(MESSAGES.NOT_PLACED_DOTS);
    }

    // Extracts the existing data and identifies the shifts that need to be created.
    const { uniqueShiftsToBeCreated, existingShifts, dotShiftAssociations } =
      await copyDotHelper(dots, copyDotDto, timezone);

    // Start a transaction
    const transaction = await this.sequelize.transaction();

    try {
      // Increment staff for existing shifts
      if (existingShifts.length > 0) {
        const shiftIds = existingShifts.map((shift) => shift.id);

        // Identifying dot_shifts where shifts already exist for specific dots, but the staff count needs to be updated.
        const dotShifts = await DotShift.findAll({
          where: { shift_id: shiftIds },
          include: [
            {
              model: DotMapDot,
              where: { event_id, placed: true },
              attributes: [],
            },
          ],
        });

        // Incrementing the staff count for all entries by +1
        for (const dotShift of dotShifts) {
          dotShift.staff += 1;
          await dotShift.save({ transaction });
        }
      }

      if (uniqueShiftsToBeCreated.length > 0) {
        const createdShifts = await DotMapShift.bulkCreate(
          uniqueShiftsToBeCreated,
          { transaction },
        );

        const createdShiftsMap = new Map(
          createdShifts.map((shift) => [
            `${new Date(shift.start_date).toISOString()}-${new Date(shift.end_date).toISOString()}`,
            shift.id,
          ]),
        );

        const updatedDotShiftAssociations = dotShiftAssociations
          .filter((association) =>
            createdShiftsMap.has(
              `${new Date(association.start_date).toISOString()}-${new Date(association.end_date).toISOString()}`,
            ),
          )
          .map((association) => {
            const key = `${new Date(association.start_date).toISOString()}-${new Date(association.end_date).toISOString()}`;
            return {
              shift_id: createdShiftsMap.get(key),
              dot_id: association.dot_id,
              rate: association.rate,
              staff: association.staff,
            };
          });

        // Bulk create dot_shifts separately, as ignoreDuplicates does not apply when using associations.
        // Including associated models (e.g., include: [{ association: 'dot_shifts' }]) bypasses ignoreDuplicates, potentially causing UNIQUE constraint violations.
        await DotShift.bulkCreate(updatedDotShiftAssociations, {
          transaction,
          ignoreDuplicates: true,
        });
      }

      // Commit the transaction
      await transaction.commit();
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      throwCatchError(error);
    }

    // pusher socket for copy dots
    sendCopyDotUpdate(event_id, this.pusherService);

    return { message: RESPONSES.copiedSuccessfully('Dots') };
  }

  async swapDots(swapDotsDto: SwapDotsDto, user: User) {
    const { dots, event_id, vendor_id } = swapDotsDto;

    // Validating if the pos_id is repeated in the CSV records
    if (checkIfDuplicateExist(dots, ['pos_id'])) {
      throw new BadRequestException(_ERRORS.DUPLICATE_POSITION_ID);
    }

    const existingPosIdDots = await DotMapDot.findAll({
      where: { pos_id: { [Op.in]: dots.map((dot) => dot.pos_id) }, event_id },
    });

    if (existingPosIdDots.length) {
      throw new ConflictException(
        RESPONSES.alreadyExist('Some Of Position Ids'),
      );
    }

    const transaction = await this.sequelize.transaction();

    try {
      const dotsToBeCreate = await bulkCreateDotsHelper(
        swapDotsDto,
        user,
        transaction,
        this.shiftService,
      );

      await DotMapDot.bulkCreate(dotsToBeCreate, {
        transaction,
        include: [{ association: 'dot_shifts' }],
      });

      // Updating all the dots with the new vendor ID.
      // In the swap process: the existing data associated with the current vendor will be swapped with the new vendor's data.
      // Additionally, any new data provided in the CSV will be uploaded under the vendor specified in the CSV.
      await DotMapDot.update(
        { vendor_id: dotsToBeCreate[0].vendor_id },
        { where: { event_id, vendor_id }, transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.log(error);
      await transaction.rollback();

      throwCatchError(error);
    }

    const vendors = await getVendorsListByEvent(event_id, { useMaster: true });

    sendDotsSocketUpdates(
      {
        message: RESPONSES.swappedSuccessfully('Dots'),
      },
      event_id,
      SocketTypesStatus.UPLOAD,
      SocketTypesModule.DOT,
      true,
      this.pusherService,
    );

    sendPriorityMissingCountUpdates(event_id, this.pusherService);

    return { message: RESPONSES.swappedSuccessfully('Dots'), vendors };
  }

  async getAllDotsByEvent(getDotsByEventDto: GetDotsByEventDto, user: User) {
    const { event_id, group_by } = getDotsByEventDto;

    const [, , timezone] = await withCompanyScope(user, event_id);

    const dots = await DotMapDot.findAll({
      where: getAllDotsWhere(getDotsByEventDto),
      attributes: {
        exclude: commonExcludeAttributes,
        include: commonIncludeAttributes,
      },
      include: commonIncludes,
      group: commonGroupBy,
    });

    // Pass the result to your PostgreSQL function
    const groupedData = await this.sequelize.query(
      group_by == DotsGroupBy.AREA
        ? `SELECT getFormattedDotsByArea(:jsonInput::jsonb) AS result`
        : `SELECT getFormattedDotsByPosition(:jsonInput::jsonb) AS result`,
      {
        replacements: {
          jsonInput: JSON.stringify(
            dots.map((dot) => dot.get({ plain: true })),
          ),
        },
        type: QueryTypes.SELECT,
      },
    );

    return { vendors: groupedData[0]['result'] || [], timezone };
  }

  async getDotById(id: number, options?: Options) {
    return await DotMapDot.findByPk(id, {
      attributes: {
        exclude: commonExcludeAttributes,
        include: commonIncludeAttributes,
      },
      include: commonIncludes,
      group: commonGroupBy,
      ...options,
    });
  }

  async checkIfAnyDotExist(event_id: number) {
    const dot = await DotMapDot.findOne({
      attributes: ['id'],
      where: { event_id },
    });

    return !!dot;
  }

  async updateBulkDots(updateBulkDotsDto: UpdateBulkDotsDto, user: User) {
    const { dot_ids, position_name, dates } = updateBulkDotsDto;

    // checking if all dots exist or not
    const dots = await allDotsExist(dot_ids);

    const [companyId, , time_zone] = await withCompanyScope(
      user,
      dots[0].event_id,
    );

    // validation of area, vendor, position
    const { shiftsToBeCreated, existingShifts, shifts } =
      await checkBulkUpdateDotValidations(
        updateBulkDotsDto,
        dates,
        time_zone,
        dots[0].event_id,
      );

    const transaction = await this.sequelize.transaction();

    try {
      let positionName: PositionName;

      if (position_name) {
        const positionNames = await bulkCreateWithCheck(
          PositionName,
          [position_name] as string[],
          companyId,
          transaction,
        );
        positionName = positionNames[0] as PositionName;
      }

      // disassocation of old shifts with selected dots
      await DotShift.destroy({
        where: { dot_id: { [Op.in]: dot_ids } },
        transaction,
      });

      let allShifts: UpdateShiftDto[];

      if (dates?.length) {
        // creating new shifts on the basis of dates
        const newlyCreatedShifts = await DotMapShift.bulkCreate(
          shiftsToBeCreated,
          {
            transaction,
          },
        );

        // converting sequelize instance to plain object
        const plainShifts = newlyCreatedShifts.map((shift) =>
          shift.get({ plain: true }),
        );

        // merging existing shifts with newly created shifts
        allShifts = [...existingShifts, ...plainShifts].map(
          ({ id, ...shift }) => ({
            ...shift,
            shift_id: id,
            rate: updateBulkDotsDto['shifts'][0].rate,
            staff: 1,
          }),
        );
      }

      const forTotalShiftHours = dates?.length ? allShifts : shifts;
      const forTotalRate = dates?.length
        ? allShifts
        : updateBulkDotsDto['shifts'];

      if (allShifts?.length || shifts?.length) {
        // this function calculates total rate and avg rate again for the dot.
        const { totalRate, avgRate } =
          await getTotalAvgRateOfBulkDot(forTotalRate);

        // if there is any record in newly created dotshift or update dotShift then totalRate or avgRate can't be null or undefined.
        // Adding 0 just to handle if something gets wrong.
        updateBulkDotsDto['total_rate'] = totalRate || 0;
        updateBulkDotsDto['avg_rate'] = avgRate || 0;

        updateBulkDotsDto['total_shift_hours'] =
          calculateTotalShiftHours(forTotalShiftHours);
      }

      const toCreateDotShifts = forTotalRate.flatMap((shift) =>
        dot_ids.map((dot_id) => ({ ...shift, dot_id })),
      );

      // association of new shifts with selected dots
      if (toCreateDotShifts.length) {
        await DotShift.bulkCreate(toCreateDotShifts, {
          transaction,
          ignoreDuplicates: true,
        });
      }

      // Update dot
      await DotMapDot.update(
        {
          ...updateBulkDotsDto,
          position_name_id: positionName?.id,
        },
        { where: { id: { [Op.in]: dot_ids } }, transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    sendDotsSocketUpdates(
      {
        message: _MESSAGES.BULK_DOTS,
      },
      dots[0].event_id,
      SocketTypesStatus.BULK_UPDATE,
      SocketTypesModule.DOT,
      true,
      this.pusherService,
    );

    sendBudgetSummarySocket(
      { ...(await budgetSummaryhelper(dots[0].event_id, { useMaster: true })) },
      dots[0].event_id,
      SocketTypesStatus.UPDATE,
      SocketTypesModule.SUMMARY,
      false,
      this.pusherService,
    );

    sendPriorityMissingCountUpdates(dots[0].event_id, this.pusherService);

    return {
      message: RESPONSES.updatedSuccessfully('Bulk Dots'),
    };
  }

  async updateDot(id: number, updateDotDto: UpdateDotDto, user: User) {
    const { position_name, location } = updateDotDto;
    let positionName: PositionName;

    const dot = await isDotExist(id);

    // Storing old data of dot which will not change event after update
    const oldDot = _.cloneDeep(dot.get({ plain: true }));

    const [companyId] = await withCompanyScope(user, dot.event_id);

    // validation of area, vendor, position
    const { dotShifts, shifts } = await checkUpdateDotValidations(
      updateDotDto,
      [id],
    );

    const transaction = await this.sequelize.transaction();

    try {
      if (position_name) {
        const positionNames = await bulkCreateWithCheck(
          PositionName,
          [position_name] as string[],
          companyId,
          transaction,
        );
        positionName = positionNames[0] as PositionName;
      }

      if (location) {
        updateDotDto['placed'] = true;
      }

      // This function is creating new dot shifts and update existing ones.
      const { toCreateShifts, toUpdateShifts, toDeleteShifts } =
        await createOrUpdateDotShifts(id, updateDotDto, dotShifts, transaction);

      if (
        toCreateShifts?.length ||
        toUpdateShifts?.length ||
        toDeleteShifts?.length
      ) {
        // this function calculates total rate and avg rate again for the dot.
        const { totalRate, avgRate } = await getTotalAvgRateOfDot(
          toUpdateShifts,
          toCreateShifts,
          toDeleteShifts,
          dotShifts,
        );

        // if there is any record in newly created dotshift or update dotShift then totalRate or avgRate can't be null or undefined.
        // Adding 0 just to handle if something gets wrong.
        updateDotDto['total_rate'] = totalRate || 0;
        updateDotDto['avg_rate'] = avgRate || 0;

        updateDotDto['total_shift_hours'] = calculateTotalShiftHours(shifts);
      }

      // Update dot
      await dot.update(
        {
          ...updateDotDto,
          position_name_id: positionName?.id,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      console.log('🚀 ~ DotService ~ updateDot ~ error:', error);
      await transaction.rollback();
      throwCatchError(error);
    }

    const updatedDot = await this.getDotById(dot.id, { useMaster: true });

    sendDotsSocketUpdates(
      {
        dot: updatedDot,
        oldDot,
      },
      dot.event_id,
      SocketTypesStatus.UPDATE,
      SocketTypesModule.DOT,
      false,
      this.pusherService,
    );

    sendBudgetSummarySocket(
      { ...(await budgetSummaryhelper(dot.event_id, { useMaster: true })) },
      dot.event_id,
      SocketTypesStatus.UPDATE,
      SocketTypesModule.SUMMARY,
      false,
      this.pusherService,
    );

    sendPriorityMissingCountUpdates(dot.event_id, this.pusherService);

    return updatedDot;
  }

  async deleteBulkDot(bulkDotsDeleteDto: BulkDotsDeleteDto, user: User) {
    const { event_id, dot_ids } = bulkDotsDeleteDto;

    await withCompanyScope(user, event_id);

    const queryParamIds = getQueryListParam(dot_ids);

    const dots = await DotMapDot.findAll({
      where: { id: { [Op.in]: queryParamIds } },
      attributes: ['id', 'vendor_id', 'area_id', 'position_id'],
    });

    const deletedDots = await DotMapDot.destroy({
      where: { id: { [Op.in]: queryParamIds } },
    });

    if (deletedDots) {
      sendDotsSocketUpdates(
        {
          deletedDots: dots.map(({ id, vendor_id, area_id, position_id }) => ({
            id,
            vendor: { id: vendor_id },
            area: { id: area_id },
            position: { id: position_id },
          })),
          message: RESPONSES.destroyedSuccessfully('Dot'),
        },
        event_id,
        SocketTypesStatus.BULK_DELETE,
        SocketTypesModule.DOT,
        false,
        this.pusherService,
      );

      sendBudgetSummarySocket(
        { ...(await budgetSummaryhelper(event_id, { useMaster: true })) },
        event_id,
        SocketTypesStatus.UPDATE,
        SocketTypesModule.SUMMARY,
        false,
        this.pusherService,
      );

      sendPriorityMissingCountUpdates(event_id, this.pusherService);
    }

    return { message: RESPONSES.destroyedSuccessfully('Dots') };
  }

  async deleteDot(id: number, event_id: number, user: User) {
    await withCompanyScope(user, event_id);

    const dot = await this.getDotById(id);
    if (!dot) throw new NotFoundException('Dot');

    await DotMapDot.destroy({ where: { id } });

    sendDotsSocketUpdates(
      {
        dot,
        message: RESPONSES.destroyedSuccessfully('Dot'),
      },
      event_id,
      SocketTypesStatus.DELETE,
      SocketTypesModule.DOT,
      false,
      this.pusherService,
    );

    sendBudgetSummarySocket(
      { ...(await budgetSummaryhelper(event_id, { useMaster: true })) },
      event_id,
      SocketTypesStatus.UPDATE,
      SocketTypesModule.SUMMARY,
      false,
      this.pusherService,
    );

    sendPriorityMissingCountUpdates(event_id, this.pusherService);

    return { message: RESPONSES.destroyedSuccessfully('Dot') };
  }

  async resetDeployment(resetDeploymentDto: ResetDeploymentDto, user: User) {
    const { event_id, vendor_id } = resetDeploymentDto;

    // Check if user has access to this event
    await withCompanyScope(user, event_id);

    if (vendor_id) await isVendorExist(vendor_id);

    // Find dots against event_id or vendor_id
    const dots = await fetchDots(resetDeploymentDto);
    const dotIds = dots.map((dot) => dot.id);

    // Delete dots in a transaction
    const transaction = await this.sequelize.transaction();

    try {
      // Destroy dot shifts first
      await DotShift.destroy({
        where: { dot_id: { [Op.in]: dotIds } },
        transaction,
      });

      // Destroy dots
      await DotMapDot.destroy({
        where: { id: { [Op.in]: dotIds } },
        transaction,
      });

      if (vendor_id) {
        // Ensure dot_shifts contain shift_id correctly
        const shiftIds = [
          ...new Set(
            dots.flatMap(
              (dot) => dot.dot_shifts?.map((ds) => ds.shift_id) || [],
            ),
          ),
        ];

        if (shiftIds.length) {
          // Find all remaining shifts that still exist after deleting vendor's dots
          const remainingShiftRecords = await DotShift.findAll({
            where: { shift_id: { [Op.in]: shiftIds } },
            attributes: ['shift_id'],
            transaction,
            useMaster: true,
          });

          // Extract remaining shift IDs (those still in use)
          const remainingShiftIds = new Set(
            remainingShiftRecords.map((ds) => ds.shift_id),
          );

          // Identify shifts that can be deleted (not in use anymore)
          const deletableShiftIds = shiftIds.filter(
            (id) => !remainingShiftIds.has(id),
          );

          if (deletableShiftIds.length) {
            await DotMapShift.destroy({
              where: {
                id: { [Op.in]: deletableShiftIds },
                event_id,
              },
              transaction,
            });
          }
        }
      } else {
        // Delete DotMapShift only if vendor_id is not provided (i.e., full event reset)
        await DotMapShift.destroy({
          where: { event_id },
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throwCatchError(error);
    }

    sendResetSocketUpdates(vendor_id, event_id, this.pusherService);

    // only in case of vendor_id, update budget summary and priority missing count
    if (vendor_id) {
      // Update budget summary
      sendBudgetSummarySocket(
        { ...(await budgetSummaryhelper(event_id, { useMaster: true })) },
        event_id,
        SocketTypesStatus.UPDATE,
        SocketTypesModule.SUMMARY,
        false,
        this.pusherService,
      );

      // Update priority missing count
      sendPriorityMissingCountUpdates(event_id, this.pusherService);
    }

    return {
      message: 'Deployment has been reset successfully',
    };
  }
}
