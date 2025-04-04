import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Template } from '@ontrack-tech-group/common/models';
import {
  ERRORS,
  Options,
  RESPONSES,
} from '@ontrack-tech-group/common/constants';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class TemplateService {
  async createTemplate(createCompanyDto: CreateTemplateDto) {
    const createdTemplate = await Template.create({ ...createCompanyDto });

    return await this.getTemplateById(createdTemplate.id, { useMaster: true });
  }

  async getAllTemplates() {
    return await Template.findAll({
      attributes: { exclude: ['updatedAt', 'createdAt'] },
    });
  }

  async getTemplateById(id: number, options?: Options) {
    return await Template.findByPk(id, {
      attributes: { exclude: ['updatedAt', 'createdAt'] },
      ...options,
    });
  }

  async updateTemplate(id: number, updateTemplateDto: UpdateTemplateDto) {
    const template = await this.getTemplateById(id);
    if (!template) throw new NotFoundException(RESPONSES.notFound('Template'));

    await template.update({ ...updateTemplateDto });

    return await this.getTemplateById(template.id, { useMaster: true });
  }

  async deleteTemplate(id: number) {
    const template = await this.getTemplateById(id);
    if (!template) throw new NotFoundException(RESPONSES.notFound('Template'));

    const isTemplateDeleted = await Template.destroy({ where: { id } });
    if (!isTemplateDeleted)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    return { message: RESPONSES.destroyedSuccessfully('Template') };
  }
}
