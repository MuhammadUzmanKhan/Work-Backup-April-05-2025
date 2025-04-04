import { faker } from '@faker-js/faker';

export const dotMapVendorFixture = () => ({
  id: faker.number.int(),
  name: faker.string.alpha(),
  cell: faker.phone.number(),
  email: faker.internet.email(),
  country_code: faker.location.countryCode(),
  country_iso_code: faker.string.alpha(),
  color: faker.color.rgb(),
  company_id: faker.number.int(),
  company: undefined,
  dots: [],
});
