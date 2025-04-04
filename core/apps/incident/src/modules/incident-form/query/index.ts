import { Sequelize } from 'sequelize';
import { Literal } from 'sequelize/types/utils';

export const getImageType: Literal = Sequelize.literal(`(
  CASE 
    WHEN "person_involveds->images"."image_type" IS NOT NULL THEN 
      CASE 
          WHEN "person_involveds->images"."image_type" = 0 THEN 'id_proof'
          WHEN "person_involveds->images"."image_type" = 1 THEN 'incident'
          WHEN "person_involveds->images"."image_type" = 2 THEN 'person_signature'
          WHEN "person_involveds->images"."image_type" = 3 THEN 'reporter_signature'
          WHEN "person_involveds->images"."image_type" = 4 THEN 'incident_area'
        END
    ELSE NULL
  END
)`);

export const getImageTypeForRawQuery = `
  CASE 
    WHEN images.image_type IS NOT NULL THEN 
      CASE 
        WHEN images.image_type = 0 THEN 'id_proof'
        WHEN images.image_type = 1 THEN 'incident'
        WHEN images.image_type = 2 THEN 'person_signature'
        WHEN images.image_type = 3 THEN 'reporter_signature'
        WHEN images.image_type = 4 THEN 'incident_area'
        ELSE NULL
      END
    ELSE NULL
  END
`;
