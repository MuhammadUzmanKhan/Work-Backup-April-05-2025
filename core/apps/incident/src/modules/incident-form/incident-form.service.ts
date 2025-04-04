import { Sequelize } from 'sequelize';
import { Request, Response } from 'express';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  successInterceptorResponseFormat,
  withCompanyScope,
} from '@ontrack-tech-group/common/helpers';
import {
  Department,
  Event,
  Image,
  Incident,
  IncidentForm,
  IncidentZone,
  Location,
  PersonInvolved,
  Representative,
  User,
  Witness,
} from '@ontrack-tech-group/common/models';
import { RESPONSES } from '@ontrack-tech-group/common/constants';
import { getImageType } from './query';
import { IncidentFormByIdDto } from './dto';
import {
  excludeAttributes,
  generatePdfForIncidentFormEjection,
  getIncidentFormAttributes,
} from './helper';

@Injectable()
export class IncidentFormService {
  constructor(private readonly httpService: HttpService) {}

  async getIncidentFormById(
    id: number,
    incidentFormByIdDto: IncidentFormByIdDto,
    user: User,
    req: Request,
    res: Response,
  ) {
    const { event_id, pdf } = incidentFormByIdDto;

    await withCompanyScope(user, event_id);

    const incidentForm = await IncidentForm.findOne({
      where: { id },
      attributes: {
        exclude: excludeAttributes(),
        include: getIncidentFormAttributes(),
      },
      include: [
        {
          model: Event,
          where: { id: event_id },
          attributes: [
            'id',
            'name',
            'start_date',
            'end_date',
            'event_location',
            'venue_name',
          ],
        },
        {
          model: Witness,
          attributes: [
            'id',
            'first_name',
            'last_name',
            'cell',
            'country_code',
            'email',
          ],
        },
        {
          model: IncidentZone,
          as: 'incident_zone',
          attributes: ['id', 'name'],
        },
        {
          model: IncidentZone,
          as: 'report_location',
          attributes: ['id', 'name'],
        },
        {
          model: Department,
          attributes: ['id', 'name'],
        },
        {
          model: Location,
          attributes: ['id', 'longitude', 'latitude'],
        },
        {
          model: Incident,
          attributes: ['id'],
        },
        {
          model: PersonInvolved,
          attributes: {
            include: [
              [PersonInvolved.getGender, 'gender'],
              [
                Sequelize.literal(`
                  CASE 
                    WHEN staff_detail IS NOT NULL AND staff_detail != ''
                    THEN 'Yes' 
                    ELSE 'No' 
                  END
                `),
                'is_staff_involved',
              ],
            ],
          },
          include: [
            {
              model: Image,
              attributes: [
                'id',
                'name',
                'url',
                'createdAt',
                'thumbnail',
                [getImageType, 'image_type'],
                [
                  Sequelize.literal(
                    `"person_involveds->images->created_by"."name"`,
                  ),
                  'createdBy',
                ],
              ],
              include: [
                {
                  model: User,
                  as: 'created_by',
                  attributes: [],
                },
              ],
            },
          ],
        },
        {
          model: Representative,
          attributes: ['id', 'first_name', 'last_name', 'department_name'],
        },
      ],
    });

    if (!incidentForm)
      throw new NotFoundException(RESPONSES.notFound('Incident Form'));

    if (pdf) {
      return await generatePdfForIncidentFormEjection(
        incidentForm,
        req,
        res,
        this.httpService,
      );
    }

    return res.send(successInterceptorResponseFormat(incidentForm));
  }
}
