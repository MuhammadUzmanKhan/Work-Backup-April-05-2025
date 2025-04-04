import { Sequelize } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CadType } from '@ontrack-tech-group/common/models';
import { Options, RESPONSES } from '@ontrack-tech-group/common/constants';
import { PusherService } from '@ontrack-tech-group/common/services';
import { checkIfNameAlreadyExistModel } from '@ontrack-tech-group/common/helpers';
import { _MESSAGES } from '@Common/constants';
import { CreateUpdateCadTypeDto } from './dto';

@Injectable()
export class CadTypeService {
  constructor(private readonly pusherService: PusherService) {}

  async createCadType(createCadTypeDto: CreateUpdateCadTypeDto) {
    const { company_id, name } = createCadTypeDto;

    // checking if cad type name already exists within the same company
    await checkIfNameAlreadyExistModel(CadType, 'Cad Type', name, company_id);

    const createdCadType = await CadType.create({ ...createCadTypeDto });

    const cadType = await this.getCadTypeById(createdCadType.id, {
      useMaster: true,
    });

    try {
      this.pusherService.sendCadTypeUpdate(cadType, company_id);
    } catch (err) {
      console.error('Pusher error:', err);
    }

    return cadType;
  }

  async getCadTypeById(id: number, options?: Options) {
    const cadType = await CadType.findOne({
      where: { id },
      attributes: [
        [Sequelize.cast(Sequelize.col('id'), 'integer'), 'id'],
        'name',
        'company_id',
      ],
      ...options,
    });

    if (!cadType) {
      throw new NotFoundException(RESPONSES.notFound('Cad Type'));
    }

    return cadType;
  }

  async getAllCadType(company_id: number) {
    return await CadType.findAll({
      where: { company_id },
      attributes: [
        [Sequelize.cast(Sequelize.col('id'), 'integer'), 'id'],
        'name',
        'company_id',
      ],
    });
  }

  async updateCadType(id: number, updateCadDto: CreateUpdateCadTypeDto) {
    const { company_id, name } = updateCadDto;

    const cadType = await this.getCadTypeById(id);

    // checking if cad type name already exists
    await checkIfNameAlreadyExistModel(
      CadType,
      'Cad Type',
      name,
      company_id,
      null,
      id,
    );

    await cadType.update(updateCadDto);

    const updatedCadType = await this.getCadTypeById(cadType.id, {
      useMaster: true,
    });

    try {
      this.pusherService.sendCadTypeUpdate(updatedCadType, company_id);
    } catch (err) {
      console.error('Pusher error:', err);
    }

    return updatedCadType;
  }

  async deleteCadType(id: number) {
    const cadType = await this.getCadTypeById(id);

    await cadType.destroy();

    return { message: RESPONSES.destroyedSuccessfully('Cad Type') };
  }
}
