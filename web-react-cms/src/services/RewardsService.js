import { API } from 'aws-amplify';

import RequestService from './RequestService';

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/reward';

class RewardsService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

export default new RewardsService(apiName, path, API);
