import { CreateCadDto, UpdateCadDto } from '@Modules/cads/dto';

export const createCad = {
  type: CreateCadDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        cad_type_id: 359,
        name: 'CAD Event 1',
        image_url: 'http://www.example.com/index.html',
        image_name: 'cad_image.png',
        location: {
          top_left: {
            latitude: '40.712776',
            longitude: '-74.005974',
          },
          top_right: {
            latitude: '40.712776',
            longitude: '-73.998024',
          },
          bottom_left: {
            latitude: '40.707776',
            longitude: '-74.005974',
          },
          bottom_right: {
            latitude: '40.707776',
            longitude: '-73.998024',
          },
          center: {
            latitude: '42.710276',
            longitude: '-74.002499',
          },
        },
      },
    },
  },
};

export const updateCad = {
  type: UpdateCadDto,
  examples: {
    Example: {
      value: {
        event_id: 2015,
        cad_type_id: 359,
        name: 'CAD Event 2',
        image_url: 'https://example.com/new-image-url.jpg',
        image_name: 'New Image Name',
        location: {
          top_left: {
            latitude: '40.712776',
            longitude: '-74.005974',
          },
          top_right: {
            latitude: '40.712776',
            longitude: '-73.998024',
          },
          bottom_left: {
            latitude: '40.707776',
            longitude: '-74.005974',
          },
          bottom_right: {
            latitude: '40.707776',
            longitude: '-73.998024',
          },
          center: {
            latitude: '42.710276',
            longitude: '-74.002499',
          },
        },
      },
    },
  },
};
