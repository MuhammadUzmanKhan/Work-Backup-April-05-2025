import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { Event, TicketClearTemplate } from '@ontrack-tech-group/common/models';
import { ERRORS } from '@ontrack-tech-group/common/constants';
import { _ERRORS } from '@Common/constants';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class TicketClearService {
  async createTemplate(createTemplateDto: CreateTemplateDto) {
    const { event_id, slug } = createTemplateDto;

    if (slug) {
      const slugExist = await TicketClearTemplate.findOne({
        where: { slug },
      });

      if (slugExist)
        throw new ForbiddenException(
          _ERRORS.TEMPLATE_WITH_SAME_SLUG_ALREADY_EXITS,
        );
    }

    const event = await Event.findOne({
      where: { id: event_id },
    });
    if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

    const eventTemplate = await TicketClearTemplate.findOne({
      where: {
        event_id,
      },
    });
    if (eventTemplate)
      throw new ConflictException(_ERRORS.EVENT_TEMPLATE_ALREADY_EXISTS);

    const newTemplate = await TicketClearTemplate.create({
      ...createTemplateDto,
    });

    return newTemplate;
  }

  async getTemplateByEventId(identifier: string | number) {
    let eventTemplate: CreateTemplateDto;

    const isNumber =
      !isNaN(parseFloat(identifier as string)) && isFinite(Number(identifier));

    if (isNumber) {
      const event = await Event.findOne({
        where: { id: +identifier },
      });

      if (!event) throw new NotFoundException(ERRORS.EVENT_NOT_FOUND);

      eventTemplate = await TicketClearTemplate.findOne({
        where: { event_id: +identifier },
        include: {
          model: Event,
        },
      });
    } else {
      eventTemplate = await TicketClearTemplate.findOne({
        where: { slug: identifier },
        include: {
          model: Event,
        },
      });
    }
    if (!eventTemplate)
      throw new NotFoundException(_ERRORS.EVENT_TEMPLATE_NOT_FOUND);

    return eventTemplate;
  }

  async updateTemplate(id: number, updateTemplateDto: UpdateTemplateDto) {
    const { slug } = updateTemplateDto;

    const eventTemplate = await this.getTemplateByEventId(id);

    if (!eventTemplate)
      throw new NotFoundException(_ERRORS.EVENT_TEMPLATE_NOT_FOUND);

    if (slug) {
      const slugExist = await TicketClearTemplate.findOne({
        where: {
          slug,
          event_id: {
            [Op.ne]: id,
          },
        },
      });

      if (slugExist)
        throw new ForbiddenException(
          _ERRORS.TEMPLATE_WITH_SAME_SLUG_ALREADY_EXITS,
        );
    }

    await TicketClearTemplate.update(
      {
        ...updateTemplateDto,
      },
      {
        where: { event_id: id },
      },
    );

    const updatedTemplate = await TicketClearTemplate.findOne({
      where: { event_id: id },
      useMaster: true,
    });

    return updatedTemplate;
  }

  async deleteTemplate(id: number) {
    const template = await TicketClearTemplate.findByPk(id);
    if (!template)
      throw new NotFoundException(_ERRORS.EVENT_TEMPLATE_NOT_FOUND);

    const isTemplateDeleted = await TicketClearTemplate.destroy({
      where: { id },
    });
    if (!isTemplateDeleted)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    return { success: true };
  }
}
