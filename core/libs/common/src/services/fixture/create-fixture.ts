import * as Models from '../../models';
import { FixtureService } from './fixture.service';

const fixtureService = new FixtureService();

export const createFixture = (
  modelName: string,
  count: number,
  iteration: number = 1,
) => {
  return fixtureService.generateFixture(Models[modelName], count, iteration);
};
