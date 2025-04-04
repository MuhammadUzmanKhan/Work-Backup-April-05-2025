import { API } from 'aws-amplify';

import RequestService from './RequestService';

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/guidebook';

class ResourceService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

export default new ResourceService(apiName, path, API);
