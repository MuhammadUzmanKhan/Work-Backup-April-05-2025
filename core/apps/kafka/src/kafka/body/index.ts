import { UserLocationDto } from '../dto';

export const createUserLocation = {
  type: UserLocationDto,
  examples: {
    Example: {
      value: {
        latitude: '24.87927621502541',
        longitude: '67.16041464662665',
        distance: 0,
        eta: 'ETA',
        speed: 0,
        battery_level: 0,
        event_id: 2015,
      },
    },
  },
};
