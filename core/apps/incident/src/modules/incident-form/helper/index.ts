import { Request, Response } from 'express';
import moment from 'moment';
import { Sequelize } from 'sequelize';
import { HttpService } from '@nestjs/axios';
import { getReportsFromLambda } from '@ontrack-tech-group/common/services';
import { IncidentForm } from '@ontrack-tech-group/common/models';
import {
  CsvOrPdf,
  ImageType,
  PdfTypes,
} from '@ontrack-tech-group/common/constants';
import { getImageTypeForRawQuery } from '../query';

export const generatePdfForIncidentFormEjection = async (
  incidentForm: IncidentForm,
  req: Request,
  res: Response,
  httpService: HttpService,
) => {
  const formattedData = formatDataForEjectionForm(
    incidentForm.get({ plain: true }),
  );

  // Api call to lambda for getting pdf
  const response: any = await getReportsFromLambda(
    req.headers.authorization,
    httpService,
    formattedData,
    CsvOrPdf.PDF,
    PdfTypes.EJECTION_FORM,
  );

  return res.send(response.data);
};

export const formatDataForEjectionForm = (incidentForm: IncidentForm) => {
  return {
    ...incidentForm,
    incident_images: incidentForm['incident_images'].map((image) => ({
      ...image,
      convertedTimestamp: moment(image.updated_at).format('MM/DD/YY - hh:mm A'),
    })),
  };
};

export const getIncidentFormAttributes: any = () => {
  const attributes = [
    [IncidentForm.getMedicalTreatment, 'medical_treatment'],
    [IncidentForm.getFormType, 'form_type'],
    [IncidentForm.getReportType, 'report_type'],
    [IncidentForm.getSourceType, 'source_type'],
    [
      Sequelize.literal(`COALESCE(
              (SELECT json_agg(json_build_object(
                'id', id, 
                'url', url, 
                'image_type', (${getImageTypeForRawQuery}), 
                'updated_at', updated_at)) 
              FROM images 
              WHERE images.image_type = ${ImageType.INCIDENT}
              AND images.imageable_id = "IncidentForm"."id" AND images.imageable_type = 'IncidentForm'
              ), '[]'
              )`),
      'incident_images',
    ],
    [
      Sequelize.literal(`COALESCE(
              (SELECT json_agg(json_build_object(
                'id', id, 
                'url', url, 
                'image_type', (${getImageTypeForRawQuery}), 
                'updated_at', updated_at
              )) 
              FROM images 
              WHERE images.image_type = ${ImageType.INCIDENT_AREA}
              AND images.imageable_id = "IncidentForm"."id" AND images.imageable_type = 'IncidentForm'
              ), '[]'
              )`),
      'incident_area_images',
    ],
    [
      Sequelize.literal(`
              (SELECT json_build_object(
                'first_name', "IncidentForm"."reporter_first_name", 
                'last_name',  "IncidentForm"."reporter_last_name", 
                'cad_incident_number',  "IncidentForm"."cad_incident_number", 
                'reporter_narrative',  "IncidentForm"."reporter_narrative",
                'image_url', (SELECT json_build_object(
                                'id', id, 
                                'url',  url, 
                                'image_type', (${getImageTypeForRawQuery})
                              )
                              FROM images 
                              WHERE images.image_type = ${ImageType.REPORTER_SIGNATURE}
                              AND images.imageable_id = "IncidentForm"."id" AND images.imageable_type = 'IncidentForm'
                              )
              )
              )`),
      'reporter_writer',
    ],
    [
      Sequelize.literal(`COALESCE(
              (SELECT (json_build_object(
                'id', id, 
                'name', name
              )) 
              FROM users 
              WHERE users.id = "IncidentForm"."updated_by_id"
              ), '{}'
              )`),
      'updated_by',
    ],
  ];

  return attributes;
};

export const excludeAttributes: any = () => {
  return [
    'updated_at',
    'reporter_first_name',
    'reporter_last_name',
    'reporter_narrative',
    'cad_incident_number',
    'witness_name',
    'witness_cell',
    'witness_email',
    'witness_country_code',
    'witness_country_iso_code',
    'updated_by_id',
    'updated_by_type',
  ];
};
