import { faker } from '@faker-js/faker';

export const dotMapDotFixture = () => ({
  id: faker.number.int(),
  event_id: faker.number.int(),
  vendor_id: faker.number.int(),
  position_id: faker.number.int(),
  position_name_id: faker.number.int(),
  area_id: faker.number.int(),
  total_shift_hours: faker.number.float({ min: 0, max: 100 }),
  pos_id: faker.string.uuid(),
  base: faker.datatype.boolean(),
  priority: faker.datatype.boolean(),
  placed: faker.datatype.boolean(),
  addition: faker.datatype.boolean(),
  location: {
    lat: faker.location.latitude().toString(),
    lng: faker.location.longitude().toString(),
  },
  avg_rate: faker.number.float({ min: 0, max: 100 }),
  total_rate: faker.number.float({ min: 0, max: 1000 }),
  missing: faker.datatype.boolean(),
});
