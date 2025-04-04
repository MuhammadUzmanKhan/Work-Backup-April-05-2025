import { CreateTemplateDto } from '../dto';

export const createTemplate = {
  type: CreateTemplateDto,
  examples: {
    Example: {
      value: {
        type: 'Event',
        config: {
          tasks: [
            {
              name: 'Upload Event Risk Assessment',
              description:
                'An Event Risk Assessment should be started during event planning and updated through the planning and event. Please upload your risk assessment - you will likely have multiple versions before the Event. The attached template is for guidance only, and using it is not mandatory.',
              attachments: [
                {
                  url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/2c79fb1708080598/DRAFT%20Risk%20guidance%20V3.xlsx',
                  name: 'DRAFT Risk Guidance V3.xlsx',
                },
              ],
            },
            {
              name: 'Upload Artist Risk Assessment',
              description:
                'An Artist Risk Assessment must be completed prior to the Event. Please upload your risk assessment. The attached template is for guidance only, and using it is not mandatory.',
              attachments: [
                {
                  url: 'https://ontrackdevelopment.s3.us-west-1.amazonaws.com/images/b748261708084945/DRAFT%20ARTIST%20RISK%20ASSESSMENT%20CROWD%20PROFILE.xlsx',
                  name: 'DRAFT ARTIST RISK ASSESSMENT CROWD PROFILE.xlsx',
                },
              ],
            },
            {
              name: 'Upload Event Management / Operations Plan',
              description:
                'The Event Operations plan should include all relevant detail on how the Event will operate. Please upload your Event Management / Operations plan.',
            },
            {
              name: 'Upload Event Org Chart',
              description:
                'The command structure of each Event should be agreed in advance. Please upload the Org Chart for your Event.',
            },
            {
              name: 'Upload Show Stop Procedure',
              description:
                'The Festival Security Assessment must be completed prior to the Event. Please upload your FSAT using the template.',
            },
            {
              name: 'Upload FSAT',
              description:
                'Each plan referenced in the Code of Practice must be completed prior to the Event. - Major Incident Plan - Communications Plan - Crowd Management Plan - Security Plan - Medical Plan - Safety Plan - Enivronmental Health Plan - Welfare Plan You can upload these individually or supply references to where this can be found in the Event Management/Operations plan. If references are supplied, plese include document name, section and page number.',
            },
          ],
        },
      },
    },
  },
};
