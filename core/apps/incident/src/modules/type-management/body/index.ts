import { CreateNewIncidentTypeAndVariationDto } from '../dto';

export const createNewIncidentTypeAndVariationBody = {
  type: CreateNewIncidentTypeAndVariationDto,
  examples: {
    Example: {
      value: {
        core_incident_type_name: 'core type new',
        variations: [
          {
            sub_company_id: 94,
            default_lang: 'en',
            variation_name: 'sub type new 94',
          },
          {
            sub_company_id: 88,
            default_lang: 'en',
            variation_name: 'sub type new 88',
          },
          {
            sub_company_id: 180,
            default_lang: 'en',
            variation_name: 'sub type new 180',
          },
        ],
        company_id: 74,
      },
    },
  },
};
