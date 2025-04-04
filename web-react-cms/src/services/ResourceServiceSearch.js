import { API } from 'aws-amplify';

import RequestService from './RequestService';

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/guidebook/search';

class ResourceServiceSearch extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

export default new ResourceServiceSearch(apiName, path, API);
