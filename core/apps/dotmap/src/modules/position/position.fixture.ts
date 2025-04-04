import { faker } from '@faker-js/faker';

export const positionFixture = () => ({
  id: faker.number.int(),
  name: faker.string.alpha(),
  company_id: faker.number.int(),
  company: undefined,
  dots: [],
});
