import { Sequelize } from 'sequelize';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  calculatePagination,
  getPageAndPageSize,
  isEventExist,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  GlobalIncident,
  Image,
  Incident,
  IncidentType,
  User,
  UserMessageConfig,
} from '@ontrack-tech-group/common/models';
import {
  Options,
  PolymorphicType,
  PusherChannels,
  PusherEvents,
  RESPONSES,
  SortBy,
} from '@ontrack-tech-group/common/constants';
import {
  ImageService,
  PusherService,
} from '@ontrack-tech-group/common/services';
import { _MESSAGES } from '@Common/constants';
import {
  CreateGlobalIncidentDto,
  GetGlobalIncidentDto,
  UpdateGlobalIncidentDto,
} from './dto';
import { countGlobalIncidents, fetchGlobalIncidentWhere } from './helper';

@Injectable()
export class GlobalIncidentService {
  constructor(
    private readonly imageService: ImageService,
    private readonly pusherService: PusherService,
  ) {}

  async createGlobalIncident(createGlobalIncidentDto: CreateGlobalIncidentDto) {
    const { event_id, image_url } = createGlobalIncidentDto;

    const { company_id } = await isEventExist(event_id);

    const globalIncident = await GlobalIncident.create({
      ...createGlobalIncidentDto,
      company_id,
    });

    if (image_url)
      await this.imageService.createImage(
        globalIncident.id,
        PolymorphicType.GLOBAL_INCIDENT,
        image_url,
        null,
        null,
        event_id,
      );

    const createdGlobalIncident = await this.getGlobalIncidentById(
      globalIncident.id,
      event_id,
      {
        useMaster: true,
      },
    );

    this.pusherService.sendDataUpdates(
      `${PusherChannels.GLOBAL_INCIDENT_CHANNEL}-${event_id}`,
      [PusherEvents.GLOBAL_INCIDENT_EVENT],
      { createdGlobalIncident },
    );

    return createdGlobalIncident;
  }

  async getGlobalIncidents(
    getGlobalIncidentDto: GetGlobalIncidentDto,
    user: User,
  ) {
    const { event_id, archived, page_size, page, order, pinned, keyword } =
      getGlobalIncidentDto;
    const [_page, _page_size] = getPageAndPageSize(page, page_size);

    await withCompanyScope(user, event_id);

    const conversations = await GlobalIncident.findAndCountAll({
      where: fetchGlobalIncidentWhere(event_id, archived, pinned, keyword),
      attributes: {
        include: [
          [
            Sequelize.literal(`CASE 
                WHEN "user_message_config"."pinned" IS NULL 
                THEN false 
                ELSE "user_message_config"."pinned" 
              END`),
            'is_pinned',
          ],
          [
            Sequelize.literal(`CASE 
              WHEN "user_message_config"."archived" IS NULL 
              THEN false 
              ELSE "user_message_config"."archived" 
            END`),
            'is_archived',
          ],
          [Sequelize.literal(`"incident_type"."name"`), 'incident_type_name'],
        ],
      },
      include: [
        {
          model: IncidentType,
          attributes: ['id'],
        },
        {
          model: UserMessageConfig,
          attributes: [],
        },
      ],
      distinct: true,
      order: [['created_at', order || SortBy.DESC]],
      limit: _page_size || undefined,
      offset: _page_size * _page || undefined,
    });

    const { rows, count } = conversations;

    const archivedCount = await countGlobalIncidents(event_id, true);

    const pinnedCount = await countGlobalIncidents(event_id, null, true);

    return {
      counts: {
        count,
        pinnedCount,
        archivedCount,
      },
      data: rows,
      pagination: calculatePagination(count, _page_size, _page),
    };
  }

  async getGlobalIncidentById(id: number, event_id: number, options?: Options) {
    const globalIncident = await GlobalIncident.findOne({
      where: { id, event_id },
      attributes: {
        exclude: ['updatedAt'],
        include: [
          [Sequelize.literal('CAST("GlobalIncident"."id" AS INTEGER)'), 'id'],
          [
            Sequelize.literal(`(
              EXISTS (
                SELECT 1
                FROM "incidents"
                WHERE "global_incident_id" = "GlobalIncident"."id"
                  AND "event_id" = "GlobalIncident"."event_id"
                  AND "company_id" = "GlobalIncident"."company_id"
              )
            )`),
            'has_linked_to_incident',
          ],
        ],
      },
      include: [
        { model: Image, attributes: ['id', 'url', 'created_at', 'capture_at'] },
        {
          model: Incident,
          attributes: [],
        },
      ],
      ...options,
    });

    if (!globalIncident)
      throw new NotFoundException(RESPONSES.notFound('Global Incident'));

    return globalIncident;
  }

  async updateGlobalIncident(
    id: number,
    updateGlobalIncidentDto: UpdateGlobalIncidentDto,
  ) {
    const { color, pinned, archived } = updateGlobalIncidentDto;

    const globalIncident = await GlobalIncident.findOne({
      where: { id },
      attributes: ['id'],
      include: [
        {
          model: UserMessageConfig,
          attributes: ['id'],
        },
      ],
    });
    if (!globalIncident)
      throw new NotFoundException(RESPONSES.notFound('Global Incident'));

    if (color)
      await globalIncident.update({
        color,
      });

    const userMessageConfig = globalIncident.user_message_config;

    // Update pinned and archived if provided
    if (userMessageConfig) {
      await userMessageConfig.update({ pinned, archived });
    }

    return { message: _MESSAGES.GLOBAL_INCIDENT_UPDATED };
  }
}
