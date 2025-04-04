import { API } from 'aws-amplify';
import RequestService from './RequestService';

class ExpertsService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/expert';

export default new ExpertsService(apiName, path, API);
